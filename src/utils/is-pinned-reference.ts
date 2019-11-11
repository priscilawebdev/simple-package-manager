import semver from 'semver';

const isPinnedReference = (ref: string | semver.SemVer) =>
  semver.valid(ref) != null;

export default isPinnedReference;
