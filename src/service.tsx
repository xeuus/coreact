import React, {Component, ComponentType, PureComponent, ReactElement} from 'react';
import {clientRead} from './helpers/clientRead';
import {RequestContext} from "./requestContext";
import {MatchResult, MatchRoute} from "./helpers/match";
import {RoutingService} from "./routingService";
import {DeserializeQuery} from "./param";
import {config, metadata, metadataOf} from "./shared";
import debounce from "lodash/debounce";
import throttle from "lodash/throttle";
import {Client} from "./client";
import {Redirect, Route, RouteComponentProps, Switch} from "react-router";

export const delayedPersist = debounce(() => {
  Client.persist();
}, 5000);
export const extractDataOnServerSide = (context: RequestContext) => {
  return context.services.reduce((acc, service) => {
    const {id, save = [], loaded = []} = metadataOf(service);
    acc[id] = acc[id] || {};
    if (save.length > 0) {
      save.forEach((data: any) => {
        const {key} = data;
        acc[id][key] = service[key];
      });
    }
    if (loaded.length > 0) {
      acc[id].__fetched__ = [];
      loaded.forEach((data: any) => {
        const {key} = data;
        acc[id].__fetched__.push(key);
      });
    }
    return acc;
  }, {});
};

export function contextOf(bind: any) {
  return bind['context'];
}

export type TimerFunc = {
  start: () => any
  stop: () => any
} & ((context: RequestContext) => void | false);

export const restoreDataOnClientSide = (context: RequestContext, initial: any) => {
  context.services.forEach((service) => {
    const {id, save = []} = metadataOf(service);
    const data = clientRead(`bridge${id}`, context.encrypt);
    if (data) {
      const json = JSON.parse(data);
      metadata(service, {
        fetched: json.__fetched__,
      });
      save.forEach((data: any) => {
        const {key} = data;
        if (json[key]) {
          service[key] = json[key];
          initial[id][key] = json[key];
        }
      });
    }
  });
};
export const gatherAsyncProperties = async (context: RequestContext) => {
  const pm = context.services.reduce((acc, service) => {
    const {fetch = [], fetched = []} = metadataOf(service);
    const loaded: any[] = [];
    fetch.forEach((data: any) => {
      const {key, pattern, options} = data;
      let matched: MatchResult = null;
      const {exact = false, sensitive = false, strict = false, environment = null} = options;
      if (environment && context.environment != environment) {
        return
      }
      if (pattern) {
        matched = MatchRoute(context.pathname, {
          exact, sensitive, strict,
          path: pattern,
        });
        if (!matched) {
          return;
        }
      }
      const func = service['$' + key] || service[key];
      if (context.environment == 'server') {
        acc.push(func.call(service, {
          ...context,
          params: matched ? matched.params : {},
        } as RequestContext));
        loaded.push({
          key,
        })
      } else {
        if (!fetched.includes(key)) {
          acc.push(func.call(service, {
            ...context,
            params: matched ? matched.params : {},
          } as RequestContext));
        }
      }
    });
    metadata(service, {
      loaded,
    });
    return acc;
  }, []);
  return await Promise.all(pm);
};
export const gatherMethods = async (context: RequestContext, name: string) => {
  const pm = context.services.reduce((acc, service) => {
    const {order = 0} = metadataOf(service);
    if (service[name]) {
      acc.push({
        order,
        func: service[name].bind(service),
      });
    }
    return acc;
  }, []).sort((a: any, b: any) => a.order - b.order);
  for (let i = 0; i < pm.length; i++) {
    await pm[i].func(context);
  }
};

function initService(context: RequestContext, service: any, fn?: (key: string, value: any) => any) {
  const {observer, observables = [], observers = [], actions = [], timers = []} = metadataOf(service);
  Object.defineProperty(service, 'context', {
    value: context,
    configurable: false,
    enumerable: false,
    writable: false,
  });
  service.constructor(context);

  if (context.environment == 'client') {
    timers.forEach((data: any) => {
      const {key, delay, disabled} = data;
      let timer: any = null;
      let startDate: Date = null;

      function recall() {
        timer = setTimeout(() => {
          const response = service[key].call(service, {
            ...context,
            dateTime: startDate,
          } as RequestContext);
          if (response !== false)
            recall();
        }, delay)
      }

      Object.defineProperty(service[key], 'stop', {
        writable: false,
        enumerable: true,
        value: function () {
          clearTimeout(timer);
        },
        configurable: true,
      });

      Object.defineProperty(service[key], 'start', {
        writable: false,
        enumerable: true,
        value: function () {

          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
          startDate = new Date();
          recall();
        },
        configurable: true,
      });
      if (!disabled) {

        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        startDate = new Date();
        recall();
      }
    });
  }
  actions.forEach((data: any) => {
    const {key, type, delay} = data;
    let func = null;
    if (type == 'debounce') {
      func = debounce(service[key], delay, {trailing: true, leading: false})
    } else if (type == 'throttle') {
      func = throttle(service[key], delay, {trailing: true, leading: false})
    }

    if (func) {
      Object.defineProperty(service, '$' + key, {
        configurable: true,
        writable: false,
        enumerable: false,
        value: service[key],
      });
      Object.defineProperty(service, key, {
        configurable: true,
        writable: false,
        enumerable: true,
        value: func,
      });
    }
  });

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
          if (fn)
            fn(key, value);
          if (context.environment != 'server') {
            observer.dispatch(key, value);
            if (context.autoPersist) {
              delayedPersist();
            }
          }
        }
      }
    });
  });
}

export function registerServices(context: RequestContext) {
  const {id: routingId} = metadataOf(RoutingService.prototype);
  let pathname = context.pathname;
  let search = context.search;
  context.services = config.services.map(a => Object.create(a.prototype));
  let routingService: RoutingService = null;
  for (let i = 0; i < context.services.length; i++) {
    const service = context.services[i];
    const {id} = metadataOf(service);
    if (routingId == id) {
      initService(context, service);
      routingService = service;
      break
    }
  }
  for (let i = 0; i < context.services.length; i++) {
    const service = context.services[i];
    const {id, query = [], url = []} = metadataOf(service);
    if (routingId != id) {
      initService(context, service, function (key: string, value: any) {
        const q = query.find((a: any) => a.key == key);
        if (routingService.history) {
          pathname = routingService.pathname;
          search = routingService.search;
        }
        const current = DeserializeQuery(search);
        if (q) {
          const {name, key, role = 'goto'} = q;
          const alias = name || key;
          if (current[alias] !== value) {
            let obj = {
              [alias]: value,
            };
            if (role == 'goto') {
              routingService.goto(obj)
            } else {
              routingService.replace(obj)
            }
          }
        } else {
          const u = url.find((a: any) => a.key == key);
          if (u) {
            const {name, key, pattern, role = 'goto'} = u;
            const alias = name || key;
            let newPath = replaceSingleMatch(pathname, pattern, alias, value);
            if (role == 'goto') {
              routingService.goto(newPath + search)
            } else {
              routingService.replace(newPath + search)
            }
          }
        }
      })
    }
  }
}

function replaceSingleMatch(url: string, pattern: string, key: string, value: string) {
  const path = url.split('/');
  const ptr = pattern.split('/');
  if (MatchRoute(url, {path: pattern, exact: false})) {
    for (let i = 0; i < ptr.length; i++) {
      if (ptr[i].startsWith(':' + key)) {
        if (typeof value === 'undefined') {
          path.splice(i, path.length - i);
          return path.join("/") + "/"
        }
        path[i] = value;
      }
    }
  }
  return path.join('/')
}

export async function callScreens(context: RequestContext, name: string) {
  const pm = config.screens.reduce((acc, item) => {
    const {order = 0, id, screen} = metadataOf(item.prototype);
    if (!(screen.options.environment && context.environment != screen.options.environment)) {
      const instance = new item({}, context);
      if (instance[name]) {
        const matched = MatchRoute(context.pathname, {
          exact: screen.options.exact, sensitive: screen.options.sensitive, strict: screen.options.strict,
          path: screen.pattern,
        });
        if (matched) {
          acc.push({
            id,
            order,
            func: instance[name],
          });
        }
      }
    }
    return acc;
  }, []).sort((a: any, b: any) => a.order - b.order);
  for (let i = 0; i < pm.length; i++) {
    const id = pm[i].id;
    context.flags['screen' + id] = 1;
    await pm[i].func(context);
  }
}

export function setParams(context: RequestContext, a?: any) {
  function call(item: any) {
    const {screen} = metadataOf(item.prototype);
    const matched = MatchRoute(context.pathname, {
      exact: screen.options.exact, sensitive: screen.options.sensitive, strict: screen.options.strict,
      path: screen.pattern,
    });
    if (matched) {
      context.params = matched.params;
    }
  }

  if (a) {
    call(a);
  } else {
    config.screens.map(call)
  }
}

export interface RoutedProps {
  screen: any;
}

export function Routed(props: { screen: any }): any {
  const {screen} = metadataOf(props.screen.prototype);
  return (
    <Route
      path={screen.pattern}
      exact={screen.options.exact}
      sensitive={screen.options.sensitive}
      strict={screen.options.strict}
      render={(data: any) => {
        if (data.staticContext) {
          data.staticContext.status = screen.status || 200;
          data.staticContext.headers = screen.headers || {};
        }
        return React.createElement(props.screen, data);
      }}/>
  );
}


export function Redirected(props: { from?: string, to: string; exact?: boolean; strict?: boolean; status?: 301 | 302; headers?: { [key: string]: any } }): any {
  return null;
}

function callScreen(item: any, i: number) {
  if (!item) {
    return null;
  }
  const {props} = item;
  if (props.screen) {
    const {id, screen} = metadataOf(props.screen.prototype);
    return (
      <Route
        key={i}
        path={screen.pattern}
        exact={screen.options.exact}
        sensitive={screen.options.sensitive}
        strict={screen.options.strict}
        render={(data: any) => {
          if (data.staticContext) {
            data.staticContext.status = screen.status || 200;
            data.staticContext.headers = screen.headers || {};
          }
          return React.createElement(props.screen, data);
        }}/>
    );
  } else if (!!props.to) {
    return (
      <Route
        key={i}
        render={(data: any) => {
          if (data.staticContext) {
            data.staticContext.status = props.status || 301;
            data.staticContext.headers = props.headers || {};
          }
          return (
            <Redirect
              from={props.from || '*'}
              to={props.to}
              exact={props.exact}
              strict={props.strict}
            />
          )
        }}/>
    );
  }
  return null;
}

export function Switched(props: { children?: ReactElement<any> | ReactElement<any>[] }) {
  const {children} = props;
  if (Array.isArray(children)) {
    return <Switch>
      {children.map(callScreen)}
    </Switch>;
  } else {
    const a = props.children as any;
    if (a) {
      callScreen(a, 0);
    }
  }
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function convertWildcard(expression: string) {
  const terms = expression.split('*');

  let trailingWildcard = false;

  let expr = '';
  for (var i = 0; i < terms.length; i++) {
    if (terms[i]) {
      if (i > 0 && terms[i - 1]) {
        expr += '.*';
      }
      trailingWildcard = false;
      expr += escapeRegExp(terms[i]);
    } else {
      trailingWildcard = true;
      expr += '.*';
    }
  }

  if (!trailingWildcard) {
    expr += '.*';
  }

  return new RegExp('^' + expr + '$', 'i');
}

export interface GroupedProps {
  group?: string,
  children?: any
}

export class Grouped extends PureComponent<GroupedProps> {
  private static defaultProps = {
    group: '*'
  };
  checker = convertWildcard(this.props.group);

  screens = config.screens.filter((item) => {
    const {screen} = metadataOf(item.prototype);
    const gp = screen.options.group || '';
    return this.checker.test(gp);
  }).sort((a: any, b: any) => {
    const {order: ao} = metadataOf(a.prototype);
    const {order: bo} = metadataOf(b.prototype);
    return ao - bo;
  });

  public render() {
    const {children} = this.props;
    return <Switch>
      {this.screens.map((screen, i) => callScreen({props: {screen}}, i))}
      {Array.isArray(children) ? children.map(callScreen) : callScreen(children, 0)}
    </Switch>;
  }
}
