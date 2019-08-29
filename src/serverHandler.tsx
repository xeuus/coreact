import React, { Fragment } from 'react';
import express, { Express, Request, Response } from 'express';

import { renderToString } from 'react-dom/server';
import { Html } from './components/html';
import { wrapHtml } from './helpers/wrapHtml';
import { Options } from './interfaces/options';
import { AppContext, AppContextProvider } from './context';
import { ServerPortal } from './components/serverPortal';
import { randomString } from './helpers/random';
import { globalModels } from './models/saviour';

export const serverHandler = (app: Express, options: Options) => {
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
      app.get(new RegExp(`^(${assetsDir}).+(.js)?.+?$`), (req, res, next) => {
        const spl = req.url.split('?');
        req.url = spl.join('.gz?');
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
      const context: AppContext = {};
      const p = new provider(context);
      p.prepare();
      globalModels.forEach(a => console.log(a.name));
      const saltKey = randomString(50);
      const now = new Date().toISOString();
      const cipher = saltKey + now;
      const html = renderToString(
        <AppContextProvider value={context}>
          <Html
            id={p.name}
            beginHead={<Fragment>
              <meta id="app-view-state" key="view-state" content={saltKey}/>
              <meta id="app-token" key="view-state" content={randomString(10)}/>
              <meta id="app-date-time" key="date-time" content={now}/>
            </Fragment>}
            endHead={<Fragment>
              {assets.map((asset, i) => {
                const [file, ...spl] = asset.split('!');
                const [name, version] = file.split('?');
                if (name.substr(-2) === 'js') {
                  return <script key={i} src={assetsDir + file} defer={spl.includes('defer')}/>;
                } else if (name.substr(-3) === 'css') {
                  return <link key={i} href={assetsDir + file} ref="stylesheet"/>;
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
