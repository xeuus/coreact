import React from 'react';
import {hydrate, render} from 'react-dom';
import {AppProvider} from './appProvider';
import {ViewHolder} from './helpers/viewHolder';
import {gatherAsyncProperties, gatherMethods, registerServices, restoreDataOnClientSide} from './service';
import {baseUrl, dateTime} from './helpers/viewState';
import {UserAgent} from 'express-useragent';
import {registerPersistClient, restorePersistedDataOnClientSide} from "./persistClientSide";
import {ConnectedRouter} from "./connectedRouter";
import {decomposeUrl, DeserializeQuery, ParseCookies} from "./param";
import {RequestContext} from "./requestContext";
import {ContextProvider} from "./context";
import {clientRead} from "./helpers/clientRead";
import {fillQueries} from "./shared";
import {checkRtl} from "./helpers/checkRtl";
import jsCookie from 'js-cookie';

export class Client {
  hydrate: any = null;
  constructor(provider: typeof AppProvider) {
    let proto = window.location.protocol;
    const idx = proto.indexOf(':');
    proto = proto.substr(0, idx);
    const rawUrl = (window.location.pathname + window.location.search).substr(baseUrl.length);
    const url = decomposeUrl(rawUrl);
    const system = JSON.parse(clientRead('system', true));
    let locale = system.locale;
    const context: RequestContext = {
      autoPersist: system.delayedPersist,
      mode: system.mode,
      url: rawUrl,
      pathname: url.pathname,
      search: url.search,
      params: {},
      body: {},
      query: DeserializeQuery(url.search),
      method: 'GET',
      hostname: window.location.hostname,
      cookies: {},
      protocol: proto,
      headers: {},
      useragent: new UserAgent().parse(window.navigator.userAgent),
      baseUrl,
      proxies: system.proxies,
      version: system.version,
      locale: locale,
      storagePrefix: system.storagePrefix,
      env: system.env,
      dateTime: new Date(dateTime),
      services: [],
      environment: 'client',
      encrypt: system.encrypt,
    };

    Object.defineProperty(context, 'query', {
      configurable: false,
      enumerable: true,
      get(): any {
        const rawUrl = (window.location.pathname + window.location.search).substr(baseUrl.length);
        const url = decomposeUrl(rawUrl);
        return DeserializeQuery(url.search);
      }
    });

    Object.defineProperty(context, 'pathname', {
      configurable: false,
      enumerable: true,
      get(): any {
        const rawUrl = (window.location.pathname + window.location.search).substr(baseUrl.length);
        const url = decomposeUrl(rawUrl);
        return url.pathname;
      }
    });

    Object.defineProperty(context, 'search', {
      configurable: false,
      enumerable: true,
      get(): any {
        const rawUrl = (window.location.pathname + window.location.search).substr(baseUrl.length);
        const url = decomposeUrl(rawUrl);
        return url.search;
      }
    });

    Object.defineProperty(context, 'url', {
      configurable: false,
      enumerable: true,
      get(): any {
        const rawUrl = (window.location.pathname + window.location.search).substr(baseUrl.length);
        return rawUrl;
      }
    });
    Object.defineProperty(context, 'cookies', {
      configurable: false,
      enumerable: true,
      get(): any {
        return ParseCookies(window.document.cookie);
      },
      set(v: any): void {
        Object.keys(v).map(key => {
          const cookie = v[key];
          if (typeof cookie === 'undefined' || cookie === null) {
            jsCookie.set(key, '', {expires: new Date(0)});
          }else {
            jsCookie.set(key, cookie);
          }
        })
      }
    });
    Object.defineProperty(context, 'locale', {
      configurable: false,
      enumerable: true,
      get(): any {
        return locale;
      },
      set(v: any): void {
        locale = v;
        if (document.documentElement.getAttribute('lang') != locale) {
          document.documentElement.setAttribute('lang', locale);
          document.documentElement.setAttribute('dir', checkRtl(locale) ? 'rtl' : 'ltr');
        }
      }
    });
    registerServices(context);
    if(context.mode=='development'){
      (window as any).context = context;
    }
    fillQueries(url.pathname, url.search, context);
    const p = new provider(context);
    const element = document.getElementById(p.name);
    const app = <ViewHolder
      splash={p.splash}
      error={p.failure}
      process={async () => {
        registerPersistClient(context);
        restorePersistedDataOnClientSide(context);
        restoreDataOnClientSide(context);
        await gatherMethods(context, 'serviceWillLoad');
        await p.providerWillLoad(context);
        try {
          gatherAsyncProperties(context);
        } catch (e) {
          console.error(e);
        }
        await p.providerDidLoad(context);
        await gatherMethods(context, 'serviceDidLoad');
      }}>{
      () => <ContextProvider context={context}>
        <ConnectedRouter>{p.application}</ConnectedRouter>
      </ContextProvider>
    }</ViewHolder>;
    if (context.mode != 'development') {
      hydrate(app, element);
    } else {
      render(app, element);
      this.hydrate = () => {
        hydrate(app, element);
      };
      window.addEventListener('orientationchange', () => {
        this.hydrate();
      });
    }
  }
  static persist = () => {
  };
  static clearStorage = () => {
  };
  static drainService = (service: { new(context?: RequestContext): any }) => {
  };
}
