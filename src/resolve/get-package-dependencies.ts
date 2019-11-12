import fetchPackageInfo from '../fetch/fetch-package';
import { transformDependencies } from '../utils';
import { Dependency } from '../typings';

async function getPackageDependencies({ name, version }: Dependency) {
  const info = await fetchPackageInfo(name);
  return transformDependencies(info.versions[version].dependencies);
}

export default getPackageDependencies;
