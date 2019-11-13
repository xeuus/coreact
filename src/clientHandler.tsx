import React from 'react';
import {hydrate, render} from 'react-dom';
import {AppProvider} from './appProvider';
import {ViewHolder} from './helpers/viewHolder';
import {gatherAsyncProperties, gatherMethods, registerServices, restoreDataOnClientSide} from './service';
import {apiAddress, apiPrefix, baseUrl, dateTime} from './helpers/viewState';
import {UserAgent} from 'express-useragent';
import {registerPersistClient, restorePersistedDataOnClientSide} from "./persistClientSide";
import {ConnectedRouter} from "./connectedRouter";
import {decomposeUrl, deserializeParams, parseCookie} from "./param";
import {RequestContext} from "./requestContext";
import {ContextProvider} from "./context";
import {fillQueries} from "./ioc";


export const clientHandler = (provider: typeof AppProvider): (() => any) => {
  let proto = window.location.protocol;
  const idx = proto.indexOf(':');
  proto = proto.substr(0, idx);
  const rawUrl = (window.location.pathname + window.location.search).substr(baseUrl.length);
  const url = decomposeUrl(rawUrl);
  const context: RequestContext = {
    url: rawUrl,
    pathname: url.pathname,
    search: url.search,
    body: {},
    query: deserializeParams(url.search),
    method: 'GET',
    hostname: window.location.hostname,
    cookies: parseCookie(window.document.cookie),
    protocol: proto,
    headers: {},
    useragent: new UserAgent().parse(window.navigator.userAgent),
    baseUrl,
    apiAddress,
    apiPrefix,
    dateTime: new Date(dateTime),
    services: [],
    environment: 'client',
    storagePrefix: 'service',
  };
  registerServices(context);
  fillQueries(url.pathname, url.search, context);

  const p = new provider(context);

  const element = document.getElementById(p.name);

  const app = <ViewHolder
    process={async () => {
      restoreDataOnClientSide(context);
      await gatherMethods(context, 'serviceWillLoad');
      await p.providerWillLoad(context);
      context.storagePrefix = p.storagePrefix;
      registerPersistClient(context);
      restorePersistedDataOnClientSide(context);
      await gatherMethods(context, 'serviceDidLoad');
      await gatherAsyncProperties(context);
      await p.providerDidLoad(context);
      await gatherMethods(context, 'serviceDidUpdated');
    }}>{
    () => <ContextProvider context={context}>
      <ConnectedRouter>{p.application}</ConnectedRouter>
    </ContextProvider>
  }</ViewHolder>;

  if (process.env.NODE_ENV === 'production') {
    hydrate(app, element);
    return () => null;
  } else {
    render(app, element);
    const update = () => hydrate(app, element);
    window.addEventListener('orientationchange', () => {
      update();
    });
    return update;
  }
};
