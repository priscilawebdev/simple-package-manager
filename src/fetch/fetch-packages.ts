import fetchPackage from './fetch-package';

async function fetchPackages(progress, { name, reference, dependencies }) {
  // `reference === undefined` means root package
  if (reference !== undefined) {
    await fetchPackage({ name, reference });
    progress.tick();
  }

  await Promise.all(
    dependencies.map(async dep => {
      progress.total += 1;
      await fetchPackages(progress, dep);
    })
  );
}

export default fetchPackages;
