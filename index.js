import fs from 'fs-extra';
import semver from 'semver';
import fetch from 'node-fetch';
import cp from 'child_process';
import util from 'util';
import { resolve, relative } from 'path';

import {
  readPackageJsonFromArchive,
  trackProgress,
  extractNpmArchiveTo
} from './utilities';

const exec = util.promisify(cp.exec);

async function fetchPackage({ name, reference }) {
  // In a pure JS fashion, if it looks like a path, it must be a path.
  if ([`/`, `./`, `../`].some(prefix => reference.startsWith(prefix)))
    return await fs.readFile(reference);

  if (semver.valid(reference))
    return await fetchPackage({
      name,
      reference: `https://registry.yarnpkg.com/${name}/-/${name}-${reference}.tgz`
    });

  const response = await fetch(reference);

  if (!response.ok) throw new Error(`Couldn't fetch package "${reference}"`);

  return await response.buffer();
}

export async function getPinnedReference({ name, reference }) {
  // 1.0.0 is a valid range per semver syntax, but since it's also a pinned
  // reference, we don't actually need to process it. Less work, yay!~
  let pinnedReference = reference;

  if (semver.validRange(pinnedReference) && !semver.valid(pinnedReference)) {
    const response = await fetch(`https://registry.yarnpkg.com/${name}`);
    const info = await response.json();

    const versions = Object.keys(info.versions);
    const maxSatisfying = semver.maxSatisfying(versions, pinnedReference);

    if (maxSatisfying === null)
      throw new Error(
        `Couldn't find a version matching "${pinnedReference}" for package "${name}"`
      );

    pinnedReference = maxSatisfying;
  }

  return { name, reference: pinnedReference };
}

export async function getPackageDependencies({ name, reference }) {
  const packageBuffer = await fetchPackage({ name, reference });
  const packageJson = JSON.parse(
    await readPackageJsonFromArchive(packageBuffer)
  );

  // Some packages have no dependency field
  const dependencies = packageJson.dependencies || {};

  // It's much easier for us to just keep using the same {name, reference}
  // data structure across all of our code, so we convert it there.
  return Object.keys(dependencies).map(name => ({
    name,
    reference: dependencies[name]
  }));
}

async function getPackageDependencyTree(
  pace,
  { name, reference, dependencies },
  available = new Map()
) {
  return {
    name,
    reference,
    dependencies: await Promise.all(
      dependencies
        .filter(volatileDependency => {
          let availableReference = available.get(volatileDependency.name);

          // If the volatile reference exactly matches the available reference (for
          // example in the case of two URLs, or two file paths), it means that it
          // is already satisfied by the package provided by its parent. In such a
          // case, we can safely ignore this dependency!
          if (volatileDependency.reference === availableReference) return false;

          // If the volatile dependency is a semver range, and if the package
          // provided by its parent satisfies it, we can also safely ignore the
          // dependency.
          if (
            semver.validRange(volatileDependency.reference) &&
            semver.satisfies(availableReference, volatileDependency.reference)
          )
            return false;

          return true;
        })
        .map(async volatileDependency => {
          pace.total += 1;

          let staticDependency = await getPinnedReference(volatileDependency);
          let subDependencies = await getPackageDependencies(staticDependency);

          let subAvailable = new Map(available);
          subAvailable.set(staticDependency.name, staticDependency.reference);

          pace.tick();

          return await getPackageDependencyTree(
            pace,
            Object.assign({}, staticDependency, {
              dependencies: subDependencies
            }),
            subAvailable
          );
        })
    )
  };
}

function optimizePackageTree({ name, reference, dependencies }) {
  // This is a Divide & Conquer algorithm - we split the large problem into
  // subproblems that we solve on their own, then we combine their results
  // to find the final solution.
  //
  // In this particular case, we will say that our optimized tree is the result
  // of optimizing a single depth of already-optimized dependencies (ie we first
  // optimize each one of our dependencies independently, then we aggregate their
  // results and optimize them all a last time).
  dependencies = dependencies.map(dependency => {
    return optimizePackageTree(dependency);
  });

  // Now that our dependencies have been optimized, we can start working on
  // doing the second pass to combine their results together. We'll iterate on
  // each one of those "hard" dependencies (called as such because they are
  // strictly required by the package itself rather than one of its dependencies),
  // and check if they contain any sub-dependency that we could "adopt" as our own.
  for (let hardDependency of dependencies.slice()) {
    for (let subDependency of hardDependency.dependencies.slice()) {
      // First we look for a dependency we own that is called
      // just like the sub-dependency we're iterating on.
      let availableDependency = dependencies.find(dependency => {
        return dependency.name === subDependency.name;
      });

      // If there's none, great! It means that there won't be any collision
      // if we decide to adopt this one, so we can just go ahead.
      if (!availableDependency) dependencies.push(subDependency);

      // If we've adopted the sub-dependency, or if the already existing
      // dependency has the exact same reference than the sub-dependency,
      // then it becomes useless and we can simply delete it.
      if (
        !availableDependency ||
        availableDependency.name === subDependency.name
      ) {
        hardDependency.dependencies.splice(
          hardDependency.dependencies.findIndex(dependency => {
            return dependency.name === subDependency.name;
          })
        );
      }
    }
  }

  return { name, reference, dependencies };
}

async function linkPackages(pace, { name, reference, dependencies }, cwd) {
  pace.total += 1;

  // As we previously seen, the root package will be the only one containing
  // no reference. We can simply skip its linking, since by definition it already
  // contains the entirety of its own code :)
  if (reference) {
    let packageBuffer = await fetchPackage({ name, reference });
    await extractNpmArchiveTo(packageBuffer, cwd);
  }

  await Promise.all(
    dependencies.map(async ({ name, reference, dependencies }) => {
      const target = `${cwd}/node_modules/${name}`;
      const binTarget = `${cwd}/node_modules/.bin`;

      await linkPackages(pace, { name, reference, dependencies }, target);

      const dependencyPackageJson = require(`${target}/package.json`);
      const bin = dependencyPackageJson.bin || {};

      if (typeof bin === `string`) bin = { [name]: bin };

      for (let binName of Object.keys(bin)) {
        const source = resolve(target, bin[binName]);
        const dest = resolve(binTarget, binName);

        await fs.mkdirp(binTarget);
        await fs.symlink(relative(binTarget, source), dest);
      }

      if (dependencyPackageJson.scripts) {
        for (let scriptName of ['preinstall', 'install', 'postinstall']) {
          const script = dependencyPackageJson.scripts[scriptName];

          if (!script) continue;

          await exec(script, {
            cwd: target,
            env: Object.assign({}, process.env, {
              PATH: `${target}/node_modules/.bin:${process.env.PATH}`
            })
          });
        }
      }
    })
  );

  pace.tick();
}

// We'll use the first command line argument (argv[2]) as working directory,
// but if there's none we'll just use the directory from which we've executed
// the script
const cwd = resolve(process.argv[2] || process.cwd());
const packageJson = require(resolve(cwd, 'package.json'));

// And as destination, we'll use the second command line argument (argv[3]),
// or the cwd if there's none. We do this because for such a minipkg, it would
// be nice not to override the 'true' node_modules :)
const dest = resolve(process.argv[3] || cwd);

// Remember that because we use a different format for our dependencies than
// a simple dictionary, we also need to convert it when reading this file
packageJson.dependencies = Object.keys(packageJson.dependencies || {}).map(
  name => {
    return { name, reference: packageJson.dependencies[name] };
  }
);

Promise.resolve()
  .then(() => {
    console.log('Resolving the package tree...');
    return trackProgress(pace => getPackageDependencyTree(pace, packageJson));
  })
  .then(packageTree => {
    console.log('Linking the packages on the filesystem...');
    return trackProgress(pace =>
      linkPackages(pace, optimizePackageTree(packageTree), dest)
    );
  })
  .catch(error => {
    console.log(error.stack);
    process.exit(1);
  });
