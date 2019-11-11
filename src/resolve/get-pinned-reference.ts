import semver from 'semver';

import { isPinnedReference } from '../utils';
import fetchPackageInfo from '../fetch/fetch-package';

const pinnedReferenceCache = new Map();

async function getPinnedReference({ name, reference }) {
  const cacheKey = `${name}/${reference}`;

  if (pinnedReferenceCache.get(cacheKey)) {
    return {
      name,
      reference: pinnedReferenceCache.get(cacheKey)
    };
  }

  if (!isPinnedReference(reference)) {
    const info = await fetchPackageInfo(name);
    const versions = Object.keys(info.versions);
    const maxSatisfying = semver.maxSatisfying(versions, reference);

    if (maxSatisfying == null) {
      throw new Error(
        `Could not find a version matching ${reference} for package ${name}`
      );
    }

    reference = maxSatisfying;
    pinnedReferenceCache.set(cacheKey, reference);
  }

  return { name, reference };
}

export default getPinnedReference;
