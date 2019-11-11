import child_process from 'child_process';
import url from 'url';

const NPM_REGISTRY = 'https://registry.yarnpkg.com';
const registry =
  child_process.execSync('npm config get registry').toString('utf8') ||
  NPM_REGISTRY;

const packageInfoCache = new Map();

async function fetchPackage(name: any) {
  if (packageInfoCache.get(name)) return packageInfoCache.get(name);
  const info = await fetch(url.resolve(registry, name));
  packageInfoCache.set(name, info);
  return info;
}

export default fetchPackage;
