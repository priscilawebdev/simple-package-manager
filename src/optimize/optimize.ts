function optimizePackageTree({
  name,
  version,
  dependencies
}: {
  name: any;
  version: any;
  dependencies: any;
}) {
  dependencies = dependencies.map(optimizePackageTree);

  for (let dependency of dependencies) {
    for (let sub of dependency.dependencies.slice()) {
      const available = dependencies.find((d: any) => d.name === sub.name);

      if (!available) {
        dependencies.push(sub);
      }

      if (!available || available.version === sub.reference) {
        const index = dependency.dependencies.findIndex(
          (d: any) => d.name === sub.name
        );
        dependency.dependencies.splice(index, 1);
      }
    }
  }

  return { name, version, dependencies };
}

export default optimizePackageTree;
