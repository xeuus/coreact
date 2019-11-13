import {RequestContext} from "./requestContext";
import {EventBus} from "./eventBus";
import {CoreContext} from "./context";
import {deserializeParams} from "./param";
import {MatchResult, matchUri} from "./helpers/match";

let counter = 0;
const services: any[] = [];

export function metadataOf(target: any) {
  return target.__metadata__ || {};
}

export function metadata(target: any, value: any) {
  Object.defineProperty(target, '__metadata__', {
    configurable: true,
    enumerable: false,
    writable: false,
    value: {
      ...metadataOf(target),
      ...value,
    }
  });
}

export function consumer(target: any) {
  const original = target;
  const func = function (props: any, context: RequestContext) {


    const {observers = []} = metadataOf(target.prototype);

    const component = this;
    const release: any[] = [];
    const originalDidMount = this.componentDidMount;
    this.componentDidMount = function (...args: any[]) {
      observers.forEach((data: any) => {
        const {key, observer, keys} = data;
        release.push(observer.listen(function (id: string, value: any) {
          if ((Array.isArray(keys) && keys.length > 0) && !keys.includes(id)) {
            return
          }
          component[key].call(component, id, value);
        }));
      });
      if (originalDidMount) {
        originalDidMount.apply(this, args);
      }
    };

    const originalUnmount = this.componentWillUnmount;
    this.componentWillUnmount = function (...args: any[]) {
      if (originalUnmount) {
        originalUnmount.apply(this, args)
      }
      release.forEach(func => func());
    };
    return original.call(this, props, context);
  };
  func.contextType = CoreContext;
  func.prototype = original.prototype;
  return func as any;
}

export function observant<T>(types: { new(context: RequestContext): T }[], ...keys: string[]) {
  return function (target: any) {

    const original = target;
    const func = function (props: any, context: RequestContext) {

      const {observers = []} = metadataOf(target.prototype);
      const component = this;


      const release: any[] = [];
      const originalDidMount = this.componentDidMount;
      this.componentDidMount = function (...args: any[]) {
        types.forEach(typ => {
          const {id} = metadataOf(typ.prototype);
          const {observer} = metadataOf(context.services[id]);
          release.push(observer.listen((id: string) => {
            if ((Array.isArray(keys) && keys.length > 0) && !keys.includes(id)) {
              return
            }
            this.forceUpdate();
          }));
        });
        observers.forEach((data: any) => {
          const {key, observer, keys} = data;
          release.push(observer.listen(function (id: string, value: any) {
            if ((Array.isArray(keys) && keys.length > 0) && !keys.includes(id)) {
              return
            }
            component[key].call(component, id, value);
          }));
        });
        if (originalDidMount) {
          originalDidMount.apply(this, args);
        }
      };
      const originalUnmount = this.componentWillUnmount;
      this.componentWillUnmount = function (...args: any[]) {
        if (originalUnmount) {
          originalUnmount.apply(this, args)
        }
        release.forEach(func => func());
      };
      return original.call(this, props, context);
    };
    func.contextType = CoreContext;
    func.prototype = original.prototype;
    return func as any;
  }
}

export function service(target: any) {
  const id = counter++;
  services[id] = target;
  metadata(target.prototype, {id, observer: new EventBus()});
  return target;
}

export function save(target: any, key: string) {
  const {save = []} = metadataOf(target);
  metadata(target, {
    save: [...save, {
      key,
    }]
  });
}

export function persist(target: any, key: string) {
  const {persist = []} = metadataOf(target);
  metadata(target, {
    persist: [...persist, {
      key,
    }]
  });
}


export function inject<T>(type: { new(context: RequestContext): T }, base: any): T {
  const meta = metadataOf(type.prototype);
  return base.context ? base.context.services[meta.id] : null;
}


export function observable(target: any, key: string) {
  const {observables = []} = metadataOf(target);
  metadata(target, {
    observables: [...observables, {
      key,
    }]
  });
}


export function fetch(target: any, key: string) {
  const {fetch = []} = metadataOf(target);
  metadata(target, {
    fetch: [...fetch, {
      key,
    }]
  });
}


export function match(pattern?: string, options: { exact?: boolean, sensitive?: boolean, strict?: boolean } = {}) {
  return (target: any, key: string) => {
    const {fetch = []} = metadataOf(target);
    metadata(target, {
      fetch: [...fetch, {
        key, pattern, options,
      }]
    });
  };
}


export function fillQueries(pathname: string, search: string, context: RequestContext) {
  const obj = deserializeParams(search);
  context.services.map((a: any) => {
    const {url = [], query = []} = metadataOf(a);
    query.forEach((q: any) => {
      const {key} = q;
      if (a[key] !== obj[key])
        a[key] = obj[key];
    });
    url.forEach((q: any) => {
      const {key, pattern, bind} = q;
      const found = matchUri(pathname, {
        exact: false, path: pattern, sensitive: false, strict: false,
      });
      if (found) {
        const params = found.params;

        if (bind) {
          a[key] = params;
        } else {
          if (a[key] !== params[key]) {
            a[key] = params[key];
          }
        }
      }
    })
  });
}

export async function runAsync(pathname: string, search: string, context: RequestContext) {
  const pm = context.services.reduce((acc, service) => {
    const {fetch = []} = metadataOf(service);
    fetch.forEach((data: any) => {
      const {key, pattern, options} = data;
      let allow = true;
      let matched: MatchResult = null;
      if (pattern) {
        const {exact = false, sensitive = false, strict = false} = options;
        matched = matchUri(pathname, {
          exact, sensitive, strict,
          path: pattern,
        });
        allow = !!matched;
      }
      if (allow) {
        const func = service[key];
        acc.push((func.bind(service))(context, matched ? matched.params : {}));
      }
    });
    return acc;
  }, []);
  return await Promise.all(pm);
}

export function fromQuery(target: any, key: string) {
  const {observables = [], query = []} = metadataOf(target);
  metadata(target, {
    query: [...query, {
      key,
    }],
    observables: [...observables, {
      key,
    }]
  });
}

export function fromUrl(pattern: string) {
  return function (target: any, key: string) {
    const {observables = [], url = []} = metadataOf(target);
    metadata(target, {
      url: [...url, {
        key,
        pattern,
      }],
      observables: [...observables, {
        key,
      }]
    });
  }
}

export function bindUrl(pattern: string) {
  return function (target: any, key: string) {
    const {observables = [], url = []} = metadataOf(target);
    metadata(target, {
      url: [...url, {
        key,
        pattern,
        bind: true,
      }],
      observables: [...observables, {
        key,
      }]
    });
  }
}


export function observe<T>(type: { new(context: RequestContext): T }, ...keys: string[]) {
  const {observer} = metadataOf(type.prototype);
  return (target: any, key: string) => {
    const {observers = []} = metadataOf(target);
    metadata(target, {
      observers: [...observers, {
        key, observer, keys,
      }]
    });
  };
}


export function registerServices(context: RequestContext) {
  context.services = services.map(a => Object.create(a.prototype));
  context.services.forEach((service: any) => {
    Object.defineProperty(service, 'context', {
      value: context,
      configurable: false,
      enumerable: false,
      writable: false,
    });
    service.constructor(context);
    const {observer, observables = [], observers = []} = metadataOf(service);
    observers.forEach((data: any) => {
      const {key, observer, keys} = data;
      observer.listen(function (id: string, value: any) {
        if ((Array.isArray(keys) && keys.length > 0) && !keys.includes(id)) {
          return
        }
        service[key].call(service, id, value);
      });
    });
    observables.forEach((data: any) => {
      const {key} = data;
      Object.defineProperty(service, '$' + key, {
        configurable: true,
        writable: false,
        enumerable: false,
        value: service[key],
      });
      Object.defineProperty(service, key, {
        configurable: true,
        enumerable: true,
        get: () => {
          return service['$' + key];
        },
        set: (value: any) => {
          if (service['$' + key] !== value) {
            Object.defineProperty(service, '$' + key, {
              configurable: true,
              writable: false,
              enumerable: false,
              value: value,
            });
            observer.dispatch(key, value);
          }
        }
      });
    });
  });
}
