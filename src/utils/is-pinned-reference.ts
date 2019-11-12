import semver from "semver";

const isPinnedReference = (version: string | semver.SemVer) =>
  semver.valid(version) != null;

export default isPinnedReference;
