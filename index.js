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

export default fetchPackage;
