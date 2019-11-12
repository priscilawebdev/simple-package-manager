import child_process from "child_process";
import url from "url";

import fetch from "./fetch";

const NPM_REGISTRY = "https://registry.yarnpkg.com";
const registry =
  child_process.execSync("npm config get registry").toString("utf8") ||
  NPM_REGISTRY;

const packageInfoCache = new Map();

async function fetchPackage(name: string) {
  if (packageInfoCache.get(name)) return packageInfoCache.get(name);
  const info = await fetch(url.resolve(registry, name));
  packageInfoCache.set(name, info.data);
  return info;
}

export default fetchPackage;
