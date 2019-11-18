import React from 'react';
import {Action, History, Location} from 'history';
import {MatchResult, MatchRoute} from './helpers/match';
import {decomposeUrl, DeserializeQuery, SerializeQuery} from "./param";
import {Observable, Service} from "./ioc";
import {RequestContext} from "./requestContext";
import {fillQueries, metadataOf} from "./shared";


export type RoutingState = {
  location: Location;
  action: Action;
  isFirstRendering: boolean;
}


async function runAsync(pathname: string, search: string, context: RequestContext) {
  const pm = context.services.reduce((acc, service) => {
    const {fetch = []} = metadataOf(service);
    fetch.forEach((data: any) => {
      const {key, pattern, options} = data;
      const {exact = false, sensitive = false, strict = false, environment = null} = options || {};
      let matched: MatchResult = null;
      if (environment && context.environment != environment) {
        return
      }
      if (pattern) {

        if (!pathname.endsWith("/"))
          pathname += "/";
        matched = MatchRoute(pathname, {
          exact, sensitive, strict,
          path: pattern,
        });
        if (!matched) {
          return;
        }
      }
      const func = service[key];
      acc.push((func.bind(service))(context, matched || {}));
    });
    return acc;
  }, []);
  return await Promise.all(pm);
}

@Service
export class RoutingService {
  history: History;
  inTimeTravelling: boolean = false;
  @Observable error: any = null;
  @Observable private state: RoutingState = {
    location: {
      pathname: '',
      state: undefined,
      search: '',
      hash: '',
      key: '',
    },
    action: null,
    isFirstRendering: true,
  };

  get dummy() {
    return this.state;
  }

  set dummy(value: RoutingState) {
    const {context} = this as any;
    fillQueries(value.location.pathname, value.location.search, context);
    if (!value.isFirstRendering) {
      runAsync(value.location.pathname, value.location.search, context).then(() => {
        this.state = value;
      }).catch((error) => {
        this.error = error;
        this.state = value;
      });
    } else {
      this.state = value;
    }
  }

  get url() {
    return this.dummy.location.pathname + this.dummy.location.search;
  }

  get pathname() {
    return this.dummy.location.pathname;
  }

  get search() {
    return this.dummy.location.search;
  }


  private act(method: 'PUSH' | 'REPLACE', data: any, params?: { [key: string]: any }){
    let a = null;
    if (typeof data === 'string') {
      a = decomposeUrl(data);
      if (params)
        a.search = this.setParams(a.search, params);
    } else {
      a = {
        pathname: this.dummy.location.pathname,
        search: this.setParams(this.dummy.location.search, data),
      };

    }
    this.dummy = {
      action: method,
      location: {
        ...this.dummy.location,
        pathname: a.pathname,
        search: a.search,
      },
      isFirstRendering: false,
    }
  }

  goto(data: any, params?: { [key: string]: any }) {
    this.act('PUSH', data, params);
  }

  replace(data: any, params?: { [key: string]: any }) {
    this.act('REPLACE', data, params);
  }

  match = (pattern: string, options: { exact?: boolean, sensitive?: boolean, strict?: boolean } = {}) => {
    const {exact = true, sensitive = false, strict = false} = options;
    return MatchRoute(this.pathname, {
      exact, sensitive, strict,
      path: pattern,
    })
  };

  private setParams = (search: string, params: { [key: string]: any }) => {
    const oldParams = DeserializeQuery(search);
    return SerializeQuery({
      ...oldParams,
      ...params,
    })
  };
}

