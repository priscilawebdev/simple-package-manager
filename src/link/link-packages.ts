import linkPackage from './link-package';

async function linkPackages(progress, { name, reference, dependencies }, cwd) {
  // not root package
  if (reference !== undefined) {
    await linkPackage(progress, { name, reference }, cwd);
  }

  await Promise.all(
    dependencies.map(async ({ name, reference, dependencies }) => {
      // link dependencies
      const target = `${cwd}/node_modules/${name}`;
      await linkPackages(progress, { name, reference, dependencies }, target);
    })
  );
}

export default linkPackages;
