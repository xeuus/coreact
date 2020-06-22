import React from 'react';
import {Action, History, Location} from 'history';
import {MatchResult, MatchRoute} from './helpers/match';
import {decomposeUrl, DeserializeQuery, SerializeQuery} from "./param";
import {observable, Order, Ordered, Bean} from "./ioc";
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
      const func = service['$' + key] || service[key];
      acc.push(func.call(service, {
        ...context,
        params: matched ? matched.params : {},
        query: DeserializeQuery(search),
        url: pathname + search,
        dateTime: new Date(),
        pathname: pathname,
        search: search,
      }));
    });
    return acc;
  }, []);
  return await Promise.all(pm);
}


@Bean
@Order(Ordered.HIGHEST_PRECEDENCE)
export class RoutingService {
  history: History;
  inTimeTravelling: boolean = false;
  @observable state: RoutingState = {
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

  get url() {
    return this.state.location.pathname + this.state.location.search;
  }

  get pathname() {
    return this.state.location.pathname;
  }

  get search() {
    return this.state.location.search;
  }

  goto(data: any, params?: { [key: string]: any }) {
    this.act('PUSH', data, params);
  }

  rewind() {
    this.history.goBack();
  }

  forward() {
    this.history.goForward();
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

  proceed = () => {
    const value = this.state;
    const {context} = this as any;
    fillQueries(value.location.pathname, value.location.search, context);
    if (!value.isFirstRendering) {
      runAsync(value.location.pathname, value.location.search, context)
    }
  };

  private act(method: 'PUSH' | 'REPLACE', data: any, params?: { [key: string]: any }) {
    let a = null;
    if (typeof data === 'string') {
      a = decomposeUrl(data);
      if (params)
        a.search = this.setParams(a.search, params);
    } else {
      a = {
        pathname: this.state.location.pathname,
        search: this.setParams(this.state.location.search, data),
      };
    }
    this.state = {
      action: method,
      location: {
        ...this.state.location,
        pathname: a.pathname,
        search: a.search,
      },
      isFirstRendering: false,
    };
    this.proceed();
  }

  private setParams = (search: string, params: { [key: string]: any }) => {
    const oldParams = DeserializeQuery(search);
    return SerializeQuery({
      ...oldParams,
      ...params,
    })
  };
}

