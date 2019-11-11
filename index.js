import fs from 'fs-extra';
import semver from 'semver';
import fetch from 'node-fetch';

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

  return { name, pinnedReference };
}
