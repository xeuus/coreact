import React from 'react';
import {clientRead} from './helpers/clientRead';
import {RequestContext} from "./requestContext";
import {metadata, metadataOf} from "./ioc";
import {matchUri} from "./helpers/match";


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
      if (pattern) {
        const {exact = false, sensitive = false, strict = false} = options;
        allow = !!matchUri(context.pathname, {
          exact, sensitive, strict,
          path: pattern,
        })
      }
      if (allow) {
        const func = service[key];
        if (!fetched.includes(key)) {
          acc.push((func.bind(service))(context));
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
