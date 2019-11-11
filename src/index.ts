import chalk from 'chalk';
import path from 'path';
import ElapstedTime from 'elapsed-time';
import fs from 'fs-extra';

import trackProgress from './utils/track-process';
import fetchPackages from './fetch/fetch-packages';
import getPackageDependencyTree from './resolve/get-package-dependency-tree';
import linkPackages from './link/link-packages';
import transformDependencies from './utils/transform-dependencies';
import optimizePackageTree from './optimize';

process.on('unhandledRejection', (reason, p) => {
  console.log('unhandled promise rejection: ', p, 'reason:', reason);
  process.exit(1);
});

const helpInfo = `
    TinyPM, a tiny nodejs pacakge manager built for fun 😛
    Usage: just type \`tinypm\` and you are done
    note, cache directory is /tmp/.tinypm
  `;

// print help info
const arg = process.argv[2];
if (arg === 'help' || arg === '-h' || arg === '--help') {
  console.log(helpInfo);
  process.exit(0);
}

const cwd = process.cwd();
const packageJSON = path.resolve(cwd, 'package.json') as any;

if (!fs.existsSync(packageJSON)) {
  console.log(chalk.red('whoops! no package.json found 😝'));
  process.exit(1);
}

const dependencies = transformDependencies(packageJSON.dependencies);
dependencies.push(...transformDependencies(packageJSON.devDependencies));

const et = ElapstedTime.new().start();

Promise.resolve()
  .then(() => {
    console.log('[1/3] 🔎  Resolving packages...');
    return trackProgress(progress =>
      getPackageDependencyTree(progress, {
        name: packageJSON.name,
        dependencies
      })
    );
  })
  .then(optimizePackageTree)
  .then(async tree => {
    console.log('[2/3] 🚢  Fetching packages...');
    await trackProgress(progress => fetchPackages(progress, tree));
    return tree;
  })
  .then(async tree => {
    console.log('[3/3] 🔗  Linking packages...');
    await trackProgress(progress => linkPackages(progress, tree, cwd));
  })
  .then(() => {
    console.log(` ✨  ${chalk.green('Done')} in ${et.getValue()}.`);
  });
