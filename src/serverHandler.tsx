import React, { Fragment } from 'react';
import express, { Express, Request, Response } from 'express';
import { renderToString } from 'react-dom/server';

import { RequestContext } from './dependencyInjection/requestContext';
import {AppContextProvider } from './dependencyInjection/appContext';
import { ServerPortal } from './components/serverPortal';
import { Html } from './components/html';
import { randomString } from './helpers/random';
import { wrapHtml } from './helpers/wrapHtml';
import { container } from './dependencyInjection/container';
import { AppProvider } from './appProvider';

export type ServerHandlerOptions = {
  matches: string[];
  assets: string[];
  gzip?: boolean;
  path: string;
  webpackOptions: any;
  provider: typeof AppProvider;
}
export const serverHandler = (app: Express, options: ServerHandlerOptions) => {
  const { matches, assets, gzip, webpackOptions, path, provider } = options;

  const isDevelopment = process.env.NODE_ENV === 'development';

  const publicPath = (webpackOptions.output && webpackOptions.output.publicPath) ? webpackOptions.output.publicPath.toString() : '/dist';

  if (isDevelopment) {
    const webpack = require('webpack');
    const compiler = webpack(webpackOptions);
    app.use(require('webpack-dev-middleware')(compiler, {
      noInfo: true,
      publicPath: publicPath,
    }));
    app.use(require('webpack-hot-middleware')(compiler, {
      log: console.log,
      path: '/__webpackhmr',
      heartbeat: 1000,
    }));
  }

  app.get('/favicon.ico', (req: Request, res: Response, next) => {
    res.statusCode = 200;
    res.end();
  });

  matches.forEach(match => {
    let baseUrl = match;
    if (baseUrl.endsWith('/*')) {
      baseUrl = baseUrl.substring(0, baseUrl.length - 2);
    }
    if (baseUrl.endsWith('*')) {
      baseUrl = baseUrl.substring(0, baseUrl.length - 1);
    }
    const assetsDir = isDevelopment ? publicPath : (baseUrl + publicPath);

    if (gzip) {
      app.get(new RegExp(`^(/dist).+(\.js)`), (req, res, next) => {
        const spl = req.url.split('?');
        req.url = spl.length > 1 ? spl.join('.gz?') : `${spl[0]}.gz`;
        res.set('Content-Encoding', 'gzip');
        res.set('Content-Type', 'application/javascript');
        next();
      });
    }

    app.use(assetsDir, express.static(path));

    app.get(match, (req: Request, res: Response, next) => {
      if (req.path.substr(-1) !== '/') {
        const query = req.url.slice(req.path.length);
        res.redirect(301, `${req.path}/${query}`);
      } else {
        next();
      }
    });
    app.get(match, async (req: Request, res: Response) => {
      const context: RequestContext = {
        url: req.url,
        services: container.instantiateRequestServices(),
      };
      Object.freeze(context);
      const p = new provider(context);
      p.prepare();
      const saltKey = randomString(50);
      const now = new Date().toISOString();
      const cipher = saltKey + now;
      const html = renderToString(
        <AppContextProvider value={context}>
          <Html
            id={p.name}
            beginHead={<Fragment>
              <meta id="app-view-state" name="view-state" content={saltKey}/>
              <meta id="app-token" name="view-state" content={randomString(10)}/>
              <meta id="app-date-time" name="date-time" content={now}/>
            </Fragment>}
            endHead={<Fragment>
              {assets.map((asset, i) => {
                const [file, ...spl] = asset.split('!');
                const [name, version] = file.split('?');
                if (name.substr(-2) === 'js') {
                  return <script key={i} src={assetsDir + file} defer={spl.includes('defer')}/>;
                } else if (name.substr(-3) === 'css') {
                  return <link key={i} href={assetsDir + file} rel="stylesheet"/>;
                }
              })}
            </Fragment>}
            beginBody={<Fragment>
              <ServerPortal id="app-data" cipher={cipher} data="hello world and fuck you universe"/>
            </Fragment>}
          >
          {!isDevelopment && p.application}
          </Html>
        </AppContextProvider>
      );
      res.statusCode = 200;
      res.end(wrapHtml(html));
    });
  });
};
