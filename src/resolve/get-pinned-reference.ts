import semver from "semver";

import { isPinnedReference } from "../utils";
import fetchPackageInfo from "../fetch/fetch-package";

const pinnedReferenceCache = new Map();

interface Props {
  name: string;
  version: string;
}

async function getPinnedReference({ name, version }: Props) {
  const cacheKey = `${name}/${version}`;

  if (pinnedReferenceCache.get(cacheKey)) {
    return {
      name,
      version: pinnedReferenceCache.get(cacheKey)
    };
  }

  if (!isPinnedReference(version)) {
    const info = await fetchPackageInfo(name);
    if (info.versions) {
      const versions = Object.keys(info.versions);
      console.log("versions", versions);
    }
    // console.log("info", info);
    // const versions = Object.keys(info.versions);
    // const maxSatisfying = semver.maxSatisfying(versions, version);

    // if (maxSatisfying == null) {
    //   throw new Error(
    //     `Could not find a version matching ${version} for package ${name}`
    //   );
    // }

    // version = maxSatisfying;
    // pinnedReferenceCache.set(cacheKey, version);
  }

  return { name, version };
}

export default getPinnedReference;
