import React, {Fragment} from 'react';
import express, {Express, Request, Response} from 'express';
import {renderToString} from 'react-dom/server';
import {Html} from './helpers/html';
import {wrapHtml} from './helpers/wrapHtml';
import {StaticRouter} from 'react-router';
import httpProxy from 'http-proxy';
import {extractDataOnServerSide, gatherAsyncProperties, gatherMethods, registerServices} from './service';
import {ServerPortal} from './helpers/serverPortal';
import {AppProvider} from './appProvider';
import {RequestContext} from "./requestContext";
import {decomposeUrl, deserializeParams} from "./param";
import {fillQueries} from "./ioc";
import {randomString} from "./helpers/functions";
import {ContextProvider} from "./context";

const cookieParser = require('cookie-parser');
const useragent = require('express-useragent');

export type ServerHandlerOptions = {
  match: string;
  assets: string[];
  enableGzip?: boolean;
  webpackOptions: any;
  proxy?: string;
  allowRedirect?: boolean;
  apiPrefix?: string;
  publicDir?: [string, string];
  bundleDir?: [string, string];
  provider: typeof AppProvider;
}
export const serverHandler = (app: Express, options: ServerHandlerOptions) => {
  const {match, apiPrefix = '/api', proxy, assets, enableGzip, webpackOptions, provider, publicDir, bundleDir, allowRedirect} = options;
  const isDevelopment = process.env.NODE_ENV === 'development';


  app.get('/favicon.ico', (req: Request, res: Response) => {
    res.statusCode = 404;
    res.end();
  });

  const proxyServer = httpProxy.createProxyServer() as any;

  let baseUrl = match;
  if (baseUrl.endsWith('/*')) {
    baseUrl = baseUrl.substring(0, baseUrl.length - 2);
  }
  if (baseUrl.endsWith('*')) {
    baseUrl = baseUrl.substring(0, baseUrl.length - 1);
  }


  const bundleUri = baseUrl + bundleDir[0];
  const publicUri = baseUrl + publicDir[0];


  const api = baseUrl + apiPrefix;
  if (proxy) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    app.all(`${api}*`, (req, res) => {
      req.url = req.url.substr(api.length);
      return proxyServer.proxyRequest(req, res, {
        changeOrigin: true,
        target: proxy,
        secure: false,
      });
    });
  }


  if (isDevelopment) {
    const webpack = require('webpack');
    webpackOptions.entry = Object.keys(webpackOptions.entry).reduce((acc: any, key) => {
      const entry = webpackOptions.entry[key];
      acc[key] = entry.map((item: string) => {
        if (item.startsWith('webpack-hot-middleware')) {
          return `webpack-hot-middleware/client?path=${baseUrl}/__webpackhmr&timeout=20000&reload=true`;
        }
        return item;
      });
      return acc;
    }, {});
    const compiler = webpack(webpackOptions);
    app.use(require('webpack-dev-middleware')(compiler, {
      noInfo: true,
      hot: true,
      stats: 'errors-only',
      publicPath: webpackOptions.output.publicPath,
    }));
    app.use(require('webpack-hot-middleware')(compiler, {
      log: console.log,
      path: baseUrl + '/__webpackhmr',
      heartbeat: 1000,
    }));
  }


  function notFound(req: Request, res: Response) {
    res.statusCode = 404;
    res.end();
  }

  if (enableGzip) {
    app.get(new RegExp(`^.+(.js.gz\?|.js.gz$)`), (req, res, next) => {
      res.set('Content-Encoding', 'gzip');
      res.set('Content-Type', 'application/javascript');
      next();
    });
  }

  app.use(publicUri, express.static(publicDir[1]), notFound);
  app.use(bundleUri, express.static(bundleDir[1]), notFound);


  app.get(match, (req: Request, res: Response, next) => {
    if (!req.path.startsWith(api) && req.path.substr(-1) !== '/') {
      const query = req.url.slice(req.path.length);
      res.redirect(301, `${req.path}/${query}`);
    } else {
      next();
    }
  });


  app.use(express.urlencoded({extended: false}));
  app.use(express.json());
  app.use(cookieParser());
  app.use(useragent.express());

  app.all(match, async (req: Request, res: Response) => {
    const now = new Date();

    const rawUrl = req.url.substr(baseUrl.length);
    const url = decomposeUrl(rawUrl);
    const context: RequestContext = {
      url: rawUrl,
      pathname: url.pathname,
      search: url.search,
      body: req.body || {},
      query: deserializeParams(url.search),
      method: req.method,
      hostname: req.hostname,
      cookies: req.cookies || {},
      protocol: req.protocol,
      headers: req.headers || {},
      useragent: (req as any).useragent || {},
      services: [],
      dateTime: now,
      baseUrl: baseUrl,
      environment: 'server',
      storagePrefix: 'service',
      apiPrefix,
      apiAddress: proxy,
    };
    registerServices(context);
    fillQueries(url.pathname, url.search, context);
    const p = new provider(context);
    await gatherMethods(context, 'serviceWillLoad');
    await p.providerWillLoad(context);
    await gatherMethods(context, 'serviceDidLoad');
    await gatherAsyncProperties(context);
    await p.providerDidLoad(context);
    await gatherMethods(context, 'serviceDidUpdated');
    const saltKey = randomString(50);
    const iso = now.toISOString();
    const cipher = saltKey + iso;
    const data = extractDataOnServerSide(context);
    const keys = Object.keys(data);
    const routerContext = {} as any;
    const html = renderToString(
      <ContextProvider context={context}>
        <StaticRouter basename={baseUrl} location={req.url} context={routerContext}>
          <Html
            id={p.name}
            beginHead={<Fragment>
              {p.beginOfHead}
              <meta id="app-view-state" name="view-state" content={saltKey}/>
              <meta id="app-token" name="token" content={randomString(10)}/>
              <meta id="app-date-time" name="date-time" content={iso}/>
              <meta id="app-base-url" name="base-url" content={baseUrl}/>
              <meta id="app-api-prefix" name="api-prefix" content={apiPrefix}/>
              <meta id="app-api-address" name="api-address" content={proxy}/>
            </Fragment>}
            endHead={<Fragment>
              {assets.map((asset, i) => {
                const [file, ...spl] = asset.split('!');
                const uri = file.startsWith('/') ? (baseUrl + file) : file;
                const [name] = file.split('?');
                if (name.substr(-3) === 'css') {
                  return <link key={i} href={uri} rel="stylesheet" type="text/css"/>;
                }
              })}
              {p.endOfHead}
            </Fragment>}
            beginBody={p.beginOfBody}
            endBody={<Fragment>
              {keys.map(key => {
                return <ServerPortal
                  id={`bridge${key}`}
                  key={key}
                  cipher={cipher}
                  data={JSON.stringify(data[key])}
                />;
              })}
              {assets.map((asset, i) => {
                const [file] = asset.split('!');
                const uri = file.startsWith('/') ? (baseUrl + file) : file;
                const [name] = file.split('?');
                if (name.substr(-2) === 'js' || name.substr(-5) === 'js.gz') {
                  return <script key={i} src={uri} type="application/javascript"/>;
                }
              })}
              {p.endOfBody}
            </Fragment>}
          >
            {!isDevelopment && p.application}
          </Html>
        </StaticRouter>
      </ContextProvider>
    );
    res.setHeader('Content-Type', 'text/html;charset=utf-8');
    if (routerContext.url && allowRedirect) {
      res.redirect(301, routerContext.url);
      return
    }
    res.statusCode = 200;
    res.end(wrapHtml(html));
  });

  //reset();
};
