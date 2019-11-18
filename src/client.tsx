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


export class Client {


  static Persist = () => {
  };
  static ClearStorage = () => {
  };
  constructor(provider: typeof AppProvider) {

    let proto = window.location.protocol;
    const idx = proto.indexOf(':');
    proto = proto.substr(0, idx);
    const rawUrl = (window.location.pathname + window.location.search).substr(baseUrl.length);
    const url = decomposeUrl(rawUrl);
    const system = JSON.parse(clientRead('system', true));
    const context: RequestContext = {
      autoPersist: system.delayedPersist,
      mode: system.mode,
      url: rawUrl,
      pathname: url.pathname,
      search: url.search,
      body: {},
      query: DeserializeQuery(url.search),
      method: 'GET',
      hostname: window.location.hostname,
      cookies: ParseCookies(window.document.cookie),
      protocol: proto,
      headers: {},
      useragent: new UserAgent().parse(window.navigator.userAgent),
      baseUrl,
      proxies: system.proxies,
      version: system.version,
      env: system.env,
      dateTime: new Date(dateTime),
      services: [],
      environment: 'client',
      encrypt: system.encrypt,
    };
    registerServices(context);
    fillQueries(url.pathname, url.search, context);
    const p = new provider(context);
    const element = document.getElementById(p.name);
    const app = <ViewHolder
      splash={p.splash}
      process={async () => {
        await gatherMethods(context, 'serviceWillLoad');
        await p.providerWillLoad(context);
        context.storagePrefix = p.storagePrefix;
        registerPersistClient(context);
        restorePersistedDataOnClientSide(context);
        restoreDataOnClientSide(context);
        await gatherAsyncProperties(context);
        await p.providerDidLoad(context);
        await gatherMethods(context, 'serviceDidLoad');
      }}>{
      () => <ContextProvider context={context}>
        <ConnectedRouter>{p.application}</ConnectedRouter>
      </ContextProvider>
    }</ViewHolder>;

    if (context.mode != 'development') {
      hydrate(app, element);
      return () => {
      };
    } else {
      render(app, element);
      const update = () => hydrate(app, element);
      window.addEventListener('orientationchange', () => {
        update();
      });
      return update;
    }
  }
}