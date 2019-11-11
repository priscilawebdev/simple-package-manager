import { resolve, relative, join } from 'path';
import util from 'util';
import child_process from 'child_process';
import fs from 'fs-extra';

import fetchPackageInfo from '../fetch/fetch-package';
import { extractArchiveTo } from '../utils';

const exec = util.promisify(child_process.exec);
const extractNPMArchiveTo = (buffer, target) =>
  extractArchiveTo(buffer, target, 1);

async function linkPackage(progress, { name, reference }, cwd) {
  progress.total += 1;

  if (fs.existsSync(cwd)) {
    progress.tick();
    return;
  }

  const buffer = await fetchPackageInfo({ name, reference });
  await extractNPMArchiveTo(buffer, cwd);

  // install binaries
  const binDir = join(cwd, '..', '.bin');
  const dependencyPackage = require(`${cwd}/package.json`);
  let bin = dependencyPackage.bin || {};
  if (typeof bin === 'string') {
    bin = { [name]: bin };
  }

  if (Object.keys(bin).length > 0) {
    await fs.mkdirp(binDir);
  }

  for (const binName of Object.keys(bin)) {
    const src = resolve(cwd, bin[binName]);
    const dest = `${binDir}/${binName}`;
    // need add executive permission manually
    // yarn: https://github.com/yarnpkg/yarn/blob/master/src/package-linker.js#L41
    if (!fs.existsSync(dest)) {
      await fs.symlink(relative(binDir, src), dest);
      await fs.chmod(dest, '755');
    }
  }

  // execute hook scripts
  if (dependencyPackage.scripts) {
    for (const scriptName of ['preinstall', 'install', 'postinstall']) {
      const script = dependencyPackage.scripts[scriptName];
      if (!script) continue;
      await exec(script, {
        cwd: cwd,
        env: Object.assign({}, process.env, {
          PATH: `${binDir}:${process.env.PATH}`
        })
      });
    }
  }

  progress.tick();
}

export default linkPackage;
