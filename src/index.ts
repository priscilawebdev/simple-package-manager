import chalk from "chalk";
import path from "path";
import ElapstedTime from "elapsed-time";
import fs from "fs-extra";
import Progress from "progress";

import trackProgress from "./utils/track-process";
// import fetchPackages from './fetch/fetch-packages';
import getPackageDependencyTree from "./resolve/get-package-dependency-tree";
// import linkPackages from './link/link-packages';
import { transformDependencies } from "./utils";
import { Dependency } from "./typings";
// import optimizePackageTree from './optimize';

process.on("unhandledRejection", (reason, p) => {
  console.log("unhandled promise rejection: ", p, "reason:", reason);
  process.exit(1);
});

// print help info
const arg = process.argv[2];
if (arg === "help" || arg === "-h" || arg === "--help") {
  console.log("A simple nodejs package manager");
  process.exit(0);
}

const cwd = process.cwd();
const packageJSONPath = path.resolve(cwd, "package.json");

// it verifies if a package.json file exists
if (!fs.existsSync(packageJSONPath)) {
  console.log(chalk.red("whoops! no package.json found 😝"));
  process.exit(1);
}

const packageJSON = require(packageJSONPath);

const dependencies: Array<Dependency> = [];
if (packageJSON && packageJSON.dependencies) {
  const transformedDependencies = transformDependencies(
    packageJSON.dependencies
  );
  dependencies.push(...transformedDependencies);
}

// CHECK-IT
const et = ElapstedTime.new().start();

Promise.resolve().then(() => {
  console.log("[1/3] 🔎  Resolving packages...");
  return trackProgress((progress: Progress) => {
    return getPackageDependencyTree(progress, {
      name: packageJSON.name,
      version: packageJSON.version,
      dependencies
    });
  });
});
// .then(optimizePackageTree)
// .then(async tree => {
//   console.log('[2/3] 🚢  Fetching packages...');
//   await trackProgress(progress => fetchPackages(progress, tree));
//   return tree;
// })
// .then(async tree => {
//   console.log('[3/3] 🔗  Linking packages...');
//   await trackProgress(progress => linkPackages(progress, tree, cwd));
// })
// .then(() => {
//   console.log(` ✨  ${chalk.green('Done')} in ${et.getValue()}.`);
// });
