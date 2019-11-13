import React from 'react';
import {Action, History, Location} from 'history';
import {matchUri} from './helpers/match';
import {decomposeUrl, deserializeParams, serializeParams} from "./param";
import {fillQueries, observable, runAsync, service} from "./ioc";


export type RoutingState = {
  location: Location;
  action: Action;
  isFirstRendering: boolean;
}

@service
export class RoutingService {
  history: History;
  inTimeTravelling: boolean = false;
  @observable error: any = null;
  @observable private state: RoutingState = {
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
    if (value.action != 'POP') {
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

  goto(data: any, params?: { [key: string]: any }) {
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
      action: 'PUSH',
      location: {
        ...this.dummy.location,
        pathname: a.pathname,
        search: a.search,
      },
      isFirstRendering: false,
    }
  }

  replace(data: any, params?: { [key: string]: any }) {
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
      action: 'REPLACE',
      location: {
        ...this.dummy.location,
        pathname: a.pathname,
        search: a.search,
      },
      isFirstRendering: false,
    };
  }

  match = (pattern: string, options: { exact?: boolean, sensitive?: boolean, strict?: boolean } = {}) => {
    const {exact = true, sensitive = false, strict = false} = options;
    return matchUri(this.pathname, {
      exact, sensitive, strict,
      path: pattern,
    })
  };

  private setParams = (search: string, params: { [key: string]: any }) => {
    const oldParams = deserializeParams(search);
    return serializeParams({
      ...oldParams,
      ...params,
    })
  };
}

