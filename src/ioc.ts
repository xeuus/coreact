import {RequestContext} from "./requestContext";
import {EventBus} from "./eventBus";
import {CoreContext} from "./context";
import {config, metadata, metadataOf} from "./shared";
import debounce from "lodash/debounce";

export interface ServiceEvents {
  serviceWillLoad?(context: RequestContext): Promise<any>;

  serviceDidLoad?(context: RequestContext): Promise<any>;

  serviceWillUnload?(context: RequestContext): Promise<any>;

  migrate?(data: any, fromVersion: number): Promise<any>;
}

export function Consumer(target: any) {
  return Observer([])(target)

}

export function Observer(types?: { new(): any }[], ...keys: string[]) {
  return function (target: any) {
    const original = target;
    const func = function (props: any, context: RequestContext) {
      const {observers = []} = metadataOf(target.prototype);
      const component = this;
      const release: any[] = [];
      const originalDidMount = this.componentDidMount;
      this.released = false;
      this.delayedRefresh = debounce(() => {
        if (this.released)
          return;
        this.forceUpdate(() => {
          if (this.serviceDidUpdate) {
            this.serviceDidUpdate.apply(this)
          }
        });
      }, 50);
      this.componentDidMount = function (...args: any[]) {
        if (types && types.length > 0) {
          types.forEach(typ => {
            const {id} = metadataOf(typ.prototype);
            const {observer} = metadataOf(context.services[id]);
            release.push(observer.listen((id: string, value: any) => {
              if (this.released)
                return;
              if ((Array.isArray(keys) && keys.length > 0) && !keys.includes(id)) {
                return
              }
              this.delayedRefresh && this.delayedRefresh(this);
            }));
          });
        }
        observers.forEach((data: any) => {
          const {key, observer, keys} = data;
          release.push(observer.listen((id: string, value: any) => {
            if (this.released)
              return;
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
        this.released = true;
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

export function Order(order: number) {
  return function (target: any) {
    metadata(target.prototype, {order});
    return target;
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

export function Autowired<T>(type: { new(context: RequestContext): T }, base: any): T {
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

export function Route(pattern?: string, options: { exact?: boolean, sensitive?: boolean, strict?: boolean, environment?: 'client' | 'server', sync?: boolean } = {}) {
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

export function Debounced(delay: number) {
  return function (target: any, key: string) {
    const {actions = []} = metadataOf(target);
    metadata(target, {
      actions: [...actions, {
        type: 'debounce',
        key,
        delay,
      }],
    });
  }
}

export function Throttle(delay: number) {
  return function (target: any, key: string) {
    const {actions = []} = metadataOf(target);
    metadata(target, {
      actions: [...actions, {
        type: 'throttle',
        key,
        delay,
      }],
    });
  }
}


export function Timer(delay: number, disabled?: boolean) {
  return function (target: any, key: string) {
    const {timers = []} = metadataOf(target);
    metadata(target, {
      timers: [...timers, {
        key,
        delay,
        disabled,
      }],
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

export function Observe(type: { new(): any }, ...keys: string[]) {
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
