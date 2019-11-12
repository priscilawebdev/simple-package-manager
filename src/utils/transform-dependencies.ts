import { Dependency } from '../typings';
interface Dependencies {
  [key: string]: string;
}

const transformDependencies = (deps: Dependencies): Array<Dependency> =>
  Object.keys(deps).map(name => ({
    name,
    version: deps[name]
  }));

export default transformDependencies;
