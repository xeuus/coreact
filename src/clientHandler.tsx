import React from 'react';
import {hydrate, render} from 'react-dom';
import {AppProvider} from './appProvider';
import {ViewHolder} from "./components/viewHolder";
import {container} from './dependencyInjection/container';
import {AppContextProvider} from './dependencyInjection/appContext';
import {RequestContext} from './dependencyInjection/requestContext';

export const clientHandler = (provider: typeof AppProvider): (() => any) => {
  const context: RequestContext = {
    url: window.location.pathname + window.location.search,
    services: {},
    observers: {},
  };
  context.services = container.instantiateRequestServices(context);
  Object.seal(context);

  const p = new provider(context);
  p.prepare();
  const element = document.getElementById(p.name);
  const app = <ViewHolder
    process={async () => {
      container.restoreData(context);
      await container.fetchData(context);
    }}>{
    () => <AppContextProvider value={context}>
      {p.application}
    </AppContextProvider>
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
