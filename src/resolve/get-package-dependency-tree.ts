import semver from 'semver';

import getPinnedReference from './get-pinned-reference';
import getPackageDependencies from './get-package-dependencies';

async function getPackageDependencyTree(
  progress,
  {
    name,
    reference,
    dependencies
  }: { name: string; reference?: any; dependencies: any },
  available = new Map()
) {
  return {
    name,
    reference,
    dependencies: await Promise.all(
      dependencies
        .filter(dep => {
          const availableReference = available.get(dep.name);

          // exact match
          if (availableReference === dep.reference) {
            return false;
          }

          // inside valid range
          if (
            semver.validRange(dep.reference) &&
            semver.satisfies(availableReference, dep.reference)
          ) {
            return false;
          }

          return true;
        })
        .map(async dep => {
          progress.total += 1;

          const pinnedDep = await getPinnedReference(dep);
          progress.tick();

          const subDependencies = await getPackageDependencies(pinnedDep);

          available.set(pinnedDep.name, pinnedDep.reference);

          return getPackageDependencyTree(
            progress,
            { ...pinnedDep, dependencies: subDependencies },
            available
          );
        })
    )
  };
}

export default getPackageDependencyTree;
