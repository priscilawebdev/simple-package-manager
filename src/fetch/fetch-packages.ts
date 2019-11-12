import fetchPackage from './fetch-package';
import { Dependency } from '../typings';

async function fetchPackages(
  progress: any,
  { name, version, dependencies }: Dependency
) {
  // `reference === undefined` means root package
  if (version !== undefined) {
    await fetchPackage({ name, version });
    progress.tick();
  }

  if (dependencies) {
    await Promise.all(
      dependencies.map(async dep => {
        progress.total += 1;
        await fetchPackages(progress, dep);
      })
    );
  }
}

export default fetchPackages;
