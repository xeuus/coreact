import {RequestContext} from "./requestContext";
import {EventBus} from "./eventBus";
import {CoreContext} from "./context";
import {config, metadata, metadataOf} from "./shared";
import debounce from "lodash/debounce";
import {callScreens, setParams} from "./service";
import {MatchRoute} from "./helpers/match";
import {string} from 'prop-types'

export interface ServiceEvents {
  serviceWillLoad?(context: RequestContext): Promise<any>;

  serviceDidLoad?(context: RequestContext): Promise<any>;

  serviceWillUnload?(context: RequestContext): Promise<any>;

  migrate?(data: any, fromVersion: number, toVersion: number): Promise<any>;
}

export interface ScreenEvents {
  screenWillLoad?(context: RequestContext): Promise<any>;
  serviceDidUpdate?(): any;
}

export interface RouteOptions {
  exact?: boolean,
  sensitive?: boolean,
  strict?: boolean,
  environment?: 'client' | 'server',
  sync?: boolean,
  status?: number,
  group?: string,
  headers?: { [key: string]: string }
}


export function Screen(pattern?: string | (() => string), options: RouteOptions = {}) {
  return (target: any) => {
    const id = config.screen++;
    config.screens[id] = target;
    metadata(target.prototype, {
      id,
      screen: {
        pattern: typeof pattern === 'function' ? pattern() : pattern,
        options,
      }
    });
  };
}


export function Consumer(target: any) {
  return Observer([])(target)
}

export function Observer(types?: { new(context?: RequestContext): any }[], ...keys: string[]) {
  return function (target: any) {
    const original = target;
    const func = function (props: any, context: RequestContext) {
      const {id, observers = [], screen} = metadataOf(target.prototype);
      const component = this;
      const release: any[] = [];
      if (this.screenWillLoad) {
        this.screenWillLoad = this.screenWillLoad.bind(this);
      }
      this.released = false;
      this.delayedRefresh = debounce(() => {
        if (this.released)
          return;
        this.forceUpdate(() => {
          if (this.serviceDidUpdate) {
            this.serviceDidUpdate.apply(this)
          }
        });
      }, 25);
      const originalDidMount = this.componentDidMount;
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

      if (screen && context.environment === 'client') {
        const originalWillMount = this.UNSAFE_componentWillMount;
        this.UNSAFE_componentWillMount = function (...args: any[]) {
          if (!(screen.options.environment && context.environment != screen.options.environment)) {
            const old = typeof context.flags['screen' + id] === 'undefined';
            const matched = MatchRoute(context.pathname, {
              exact: screen.options.exact, sensitive: screen.options.sensitive, strict: screen.options.strict,
              path: screen.pattern,
            });

            if (old === !!matched || context.flags['screen' + id] > 1) {
              setParams(context, target);
              if (component.screenWillLoad) {
                component.screenWillLoad.call(this, context);
              }
            }
            context.flags['screen' + id] = context.flags['screen' + id] || 1;
            context.flags['screen' + id]++;
          }
          if (originalWillMount) {
            originalWillMount.apply(this, args)
          }
        };
      }
      return original.call(this, props, context);
    };
    func.contextType = CoreContext;
    func.prototype = original.prototype;
    return func as any;
  }
}

export const Ordered = {
  HIGHEST_PRECEDENCE: -999999999,
  LOWEST_PRECEDENCE: 999999999,
};


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

export function Autowired<T>(type: { new(context?: RequestContext): T }, base: any): T {
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

export function Route(pattern?: string, options: RouteOptions = {}) {
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

export function Observe(types: { new(context?: RequestContext): any }[], ...keys: string[]) {
  return (target: any, key: string) => {
    types.forEach(type => {
      const {observer} = metadataOf(type.prototype);
      const {observers = []} = metadataOf(target);
      metadata(target, {
        observers: [...observers, {
          key, observer, keys,
        }]
      });
    })
  };
}
