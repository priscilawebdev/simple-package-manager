const transformDependencies = (deps: Object = {}) =>
  Object.keys(deps).map(name => ({
    name,
    reference: deps[name]
  }));

export default transformDependencies;
