import React from 'react';
import {hydrate, render} from 'react-dom';
import {AppProvider} from './appProvider';
import {ApplicationContext, AppContextProvider} from './appContext';
import {ViewHolder} from "./components/viewHolder";
import {globalModels} from "./models/service";

export const clientHandler = (provider: typeof AppProvider): (() => any) => {
  const context: ApplicationContext = {
    url: window.location.pathname+window.location.search,
    services: {},
  };
  globalModels.forEach((a: any) => {
    context.services[a.identifier] = new a();
  });
  const p = new provider(context);
  p.prepare();
  const element = document.getElementById(p.name);

  const app = <ViewHolder
    process={async () => {
      return 'hello';
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
