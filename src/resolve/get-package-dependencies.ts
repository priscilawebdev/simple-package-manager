import fetchPackageInfo from '../fetch/fetch-package';
import { transformDependencies } from '../utils';

async function getPackageDependencies({ name, reference }) {
  const info = await fetchPackageInfo(name);
  return transformDependencies(info.versions[reference].dependencies);
}

export default getPackageDependencies;
