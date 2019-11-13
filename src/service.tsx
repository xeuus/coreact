import React from 'react';
import {clientRead} from './helpers/clientRead';
import {RequestContext} from "./requestContext";
import {metadata, metadataOf, services} from "./ioc";
import {MatchResult, matchUri} from "./helpers/match";
import {RoutingService} from "./routingService";
import {deserializeParams} from "./param";


export class Service {
  constructor(context: RequestContext) {
  }

  serviceWillLoad?(context: RequestContext): Promise<any>;

  serviceDidLoad?(context: RequestContext): Promise<any>;

  serviceDidUpdated?(context: RequestContext): Promise<any>;
}


export const extractDataOnServerSide = (context: RequestContext) => {
  return context.services.reduce((acc, service) => {
    const {id, save = [], fetch = []} = metadataOf(service);
    acc[id] = acc[id] || {};
    if (save.length > 0) {
      save.forEach((data: any) => {
        const {key} = data;
        acc[id][key] = service[key];
      });
    }
    if (fetch.length > 0) {
      acc[id].__fetched__ = [];
      fetch.forEach((data: any) => {
        const {key} = data;
        acc[id].__fetched__.push(key);
      });
    }
    return acc;
  }, {});
};


export const restoreDataOnClientSide = (context: RequestContext) => {
  context.services.forEach((service) => {
    const {id, save = []} = metadataOf(service);
    const data = clientRead(`bridge${id}`);
    if (data) {
      const json = JSON.parse(data);
      metadata(service, {
        fetched: json.__fetched__,
      });
      save.forEach((data: any) => {
        const {key} = data;
        if (json[key]) {
          service[key] = json[key];
        }
      });
    }
  });
};

export const gatherAsyncProperties = async (context: RequestContext) => {
  const pm = context.services.reduce((acc, service) => {
    const {fetch = [], fetched = []} = metadataOf(service);
    fetch.forEach((data: any) => {
      const {key, pattern, options} = data;
      let allow = true;
      let matched: MatchResult = null;
      if (pattern) {
        const {exact = false, sensitive = false, strict = false} = options;
        matched = matchUri(context.pathname, {
          exact, sensitive, strict,
          path: pattern,
        });
        allow = !!matched;
      }
      if (allow) {
        const func = service[key];

        if (!fetched.includes(key)) {
          acc.push((func.bind(service))(context, matched ? matched.params : {}));
        }
      }
    });
    return acc;
  }, []);
  return await Promise.all(pm);
};

export const gatherMethods = async (context: RequestContext, name: string) => {
  const pm = context.services.reduce((acc, service) => {
    if (service[name]) {
      acc.push(service[name](context));
    }
    return acc;
  }, []);
  return await Promise.all(pm);
};


function initService(context: RequestContext, service: any, fn?: (key: string, value: any) => any) {
  const {observer, observables = [], observers = [], query = []} = metadataOf(service);
  Object.defineProperty(service, 'context', {
    value: context,
    configurable: false,
    enumerable: false,
    writable: false,
  });
  service.constructor(context);
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
  context.services = services.map(a => Object.create(a.prototype));
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
        if (typeof window !== 'undefined') {
          pathname = window.location.pathname;
          search = window.location.search;
        }
        const current = deserializeParams(search);

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
  if (matchUri(url, {path: pattern, exact: false})) {
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
