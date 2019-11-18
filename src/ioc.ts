import {RequestContext} from "./requestContext";
import {EventBus} from "./eventBus";
import {CoreContext} from "./context";
import {config, delayedRefresh, metadata, metadataOf} from "./shared";


export function Consumer(target: any) {
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

export function Observer<T>(types: { new(context: RequestContext): T }[], ...keys: string[]) {
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
            delayedRefresh(this);
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

export function Service(target: any) {
  const id = config.counter++;
  config.services[id] = target;
  metadata(target.prototype, {id, observer: new EventBus()});
  return target;
}

export function Piped(target: any, key: string) {
  const {save = []} = metadataOf(target);
  metadata(target, {
    save: [...save, {
      key,
    }]
  });
}

export function Persisted(target: any, key: string) {
  const {persist = []} = metadataOf(target);
  metadata(target, {
    persist: [...persist, {
      key,
    }]
  });
}

export function AutoWired<T>(type: { new(context: RequestContext): T }, base: any): T {
  const meta = metadataOf(type.prototype);
  return base.context ? base.context.services[meta.id] : null;
}


export function Observable(target: any, key: string) {
  const {observables = []} = metadataOf(target);
  metadata(target, {
    observables: [...observables, {
      key,
    }]
  });
}


export function Route(pattern?: string, options: { exact?: boolean, sensitive?: boolean, strict?: boolean, environment?: 'client' | 'server' } = {}) {
  return (target: any, key: string) => {
    const {fetch = []} = metadataOf(target);
    metadata(target, {
      fetch: [...fetch, {
        key, pattern, options
      }]
    });
  };
}


export function FromQuery(target: any, key: string) {
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

export function BindQuery(name: string, role?: 'replace' | 'goto') {
  return function (target: any, key: string) {
    const {observables = [], query = []} = metadataOf(target);
    metadata(target, {
      query: [...query, {
        key,
        name,
        role,
      }],
      observables: [...observables, {
        key,
      }]
    });
  }
}

export function FromUrl(pattern: string) {
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

export function BindUrl(pattern: string, name: string, role?: 'replace' | 'goto') {
  return function (target: any, key: string) {
    const {observables = [], url = []} = metadataOf(target);
    metadata(target, {
      url: [...url, {
        key,
        pattern,
        name,
        role,
      }],
      observables: [...observables, {
        key,
      }]
    });
  }
}


export function Observe<T>(type: { new(context: RequestContext): T }, ...keys: string[]) {
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
