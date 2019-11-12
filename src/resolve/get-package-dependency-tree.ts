import semver from "semver";
import Progress from "progress";

import getPinnedReference from "./get-pinned-reference";
import getPackageDependencies from "./get-package-dependencies";
import { Dependency } from "../typings";

async function getPackageDependencyTree(
  progress: Progress,
  dependency: Dependency,
  available = new Map()
): Promise<Dependency> {
  return {
    ...dependency,
    dependencies:
      dependency.dependencies &&
      (await Promise.all(
        dependency.dependencies
          .filter((dep: Dependency) => {
            const availableReference = available.get(dep.name);

            // exact match
            if (availableReference === dep.version) {
              return false;
            }

            // inside valid range
            if (
              semver.validRange(dep.version) &&
              semver.satisfies(availableReference, dep.version)
            ) {
              return false;
            }

            return true;
          })
          .map(async (dep: Dependency) => {
            progress.total += 1;

            const pinnedDep = await getPinnedReference(dep);
            progress.tick();

            const subDependencies = await getPackageDependencies(pinnedDep);

            available.set(pinnedDep.name, pinnedDep.version);

            return getPackageDependencyTree(
              progress,
              { ...pinnedDep, dependencies: subDependencies },
              available
            );
          })
      ))
  };
}

export default getPackageDependencyTree;
