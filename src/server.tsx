import React from 'react';
import express, {Express, Request, Response} from 'express';
import {renderToString} from 'react-dom/server';
import {Html} from './helpers/html';
import {wrapHtml} from './helpers/wrapHtml';
import {StaticRouter} from 'react-router';
import httpProxy from 'http-proxy';
import {callScreens, extractDataOnServerSide, gatherAsyncProperties, registerServices, setParams} from './service';
import {ServerPortal} from './helpers/serverPortal';
import {AppProvider} from './appProvider';
import {RequestContext} from "./requestContext";
import {decomposeUrl, DeserializeQuery} from "./param";
import {randomString} from "./helpers/functions";
import {ContextProvider} from "./context";
import {fillQueries, metadataOf} from "./shared";
import {RequireMiddleware} from "./require";
import {invoke, invokeAll} from "./invoke";

const cookieParser = require('cookie-parser');
const useragent = require('express-useragent');
export type Proxy = {
  address: string,
  baseUrl?: string,
}
export type ServerOptions = {
  provider: () => typeof AppProvider;
  assets: string[];
  publicDir: [string, string];
  bundleDir: [string, string];
  webpackOptions: any;
  rootPath: string;
  srcPath: string;
  distPath: string;
  storagePrefix: string;
  mode?: string,
  envKeys?: string[];
  match?: string;
  version?: number;
  enableGzip?: boolean;
  encrypt?: boolean;
  delayedPersist?: boolean;
  proxies?: { [key: string]: Proxy };
  allowRedirect?: boolean;
  apiPrefix?: string;
}

export class Server {
  options: ServerOptions = {
    mode: 'production',
    envKeys: [],
    match: '/*',
    version: 1,
    provider: null,
    assets: [],
    enableGzip: true,
    encrypt: true,
    delayedPersist: true,
    webpackOptions: {},
    proxies: {},
    allowRedirect: false,
    apiPrefix: '/api',
    publicDir: ['/assets', '.'],
    bundleDir: ['/dist', '.'],
    rootPath: '.',
    srcPath: '.',
    distPath: '.',
    storagePrefix: 'app',
  };

  constructor(options: ServerOptions) {
    this.options = {
      ...this.options,
      ...options,
    }
  }

  isolate = (name: string) => {
    if (name) {
      if (name == '*') {
        this.options.bundleDir[1] = this.options.bundleDir[1] + '/default';
        return
      }
      const path = '/' + name;
      this.options.bundleDir[1] = this.options.bundleDir[1] + path;
      this.options.match = path + '*';
    }
  };

  start(app: Express) {
    const {match, storagePrefix, encrypt, version, envKeys, mode, delayedPersist, apiPrefix, proxies, assets, enableGzip, webpackOptions, publicDir, bundleDir, allowRedirect} = this.options;
    const proxyServer = httpProxy.createProxyServer() as any;
    let baseUrl = match;
    if (baseUrl.endsWith('/*')) {
      baseUrl = baseUrl.substring(0, baseUrl.length - 2);
    } else if (baseUrl.endsWith('*')) {
      baseUrl = baseUrl.substring(0, baseUrl.length - 1);
    }
    const bundleUri = baseUrl + bundleDir[0];
    const publicUri = baseUrl + publicDir[0];
    RequireMiddleware(baseUrl, bundleUri, this.options.rootPath, this.options.srcPath, this.options.distPath);
    const provider = this.options.provider();
    app.get(baseUrl + '/favicon.ico', (req: Request, res: Response) => {
      res.statusCode = 404;
      res.end();
    });
    const api = baseUrl + apiPrefix;
    const keys = Object.keys(proxies).map(a => {
      return {
        address: proxies[a].address,
        baseUrl: proxies[a].baseUrl || '',
      };
    });
    if (keys.length > 0) {
      app.all(`${api}*`, (req, res) => {
        // req.url = req.url.substr(api.length);
        for (let i = 0; i < keys.length; i++) {
          const {address, baseUrl} = keys[i];
          const prefix = api + baseUrl;
          if (req.url.startsWith(prefix)) {
            req.url = req.url.substr(prefix.length);
            return proxyServer.proxyRequest(req, res, {
              changeOrigin: true,
              target: address,
              secure: false,
            });
          }
        }
        res.statusCode = 404;
        res.end('404 page not found');
      });
    }
    if (this.isDev()) {
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
        title: 'Coreact',
        meta: [],
        autoPersist: delayedPersist,
        mode: mode,
        url: rawUrl,
        pathname: url.pathname,
        search: url.search,
        body: req.body || {},
        params: {},
        query: DeserializeQuery(url.search),
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
        storagePrefix: storagePrefix,
        version: version,
        encrypt: encrypt,
        flags: {},
        locale: 'en',
        env: envKeys.reduce((acc, key) => {
          acc[key] = process.env[key];
          return acc;
        }, {} as any),
        proxies: proxies ? Object.keys(proxies).map(key => {
          const proxy = proxies[key];
          return {
            key: key,
            address: proxy.address,
          }
        }).reduce((acc, value) => {
          acc[value.key] = value.address;
          return acc;
        }, {} as any) : {},
      };

      context.pick = (target) => {
        const meta = metadataOf(target.prototype);
        return context.services[meta.id];
      };
      context.invoke = async (target, name,...args) => await invoke(context, target, name, ...args);
      context.invokeAll = async (name, ...args) => await invokeAll(context, 'all', name, ...args);
      context.invokeLinear = async (name, ...args) => await invokeAll(context, 'linear', name, ...args);
      context.invokeParallel = async (name, ...args) => await invokeAll(context, 'parallel', name, ...args);
      context.invokeRace = async (name, ...args) => await invokeAll(context, 'race', name, ...args);

      const forClient = proxies ? Object.keys(proxies).map(key => {
        const {baseUrl = ''} = proxies[key];
        return {
          key: key,
          address: api + baseUrl,
        }
      }).reduce((acc, value) => {
        acc[value.key] = value.address;
        return acc;
      }, {} as any) : {};
      registerServices(context);
      fillQueries(url.pathname, url.search, context);
      setParams(context);
      const p = new provider(context);
      try {
        await context.invokeLinear('serviceWillStart', context);
        await p.providerWillStart(context);
        await context.invokeLinear( 'serviceWillLoad', context);
        await p.providerWillLoad(context);
        try {
          await gatherAsyncProperties(context);
        } catch (e) {
          console.error(e);
        }
        await context.invokeLinear( 'serviceDidLoad', context);
        await callScreens(context, 'screenWillLoad');
        const saltKey = randomString(50);
        const iso = now.toISOString();
        const cipher = saltKey + iso;
        await p.providerDidLoad(context);
        await context.invokeLinear( 'serviceWillUnload', context);
        const data = extractDataOnServerSide(context);
        const keys = Object.keys(data);
        const routerContext = {} as any;
        const html = renderToString(
          <ContextProvider context={context}>
            <StaticRouter basename={baseUrl} location={req.url} context={routerContext}>
              <Html
                id={p.name}
                title={context.title}
                locale={context.locale}
                beginHead={<>
                  {context.meta.map((m, i) => {
                    return <meta key={i} id={m.id} name={m.name} content={m.content} httpEquiv={m.httpEquiv}/>
                  })}
                  {p.beginOfHead}
                  <meta id="app-view-state" name="view-state" content={saltKey}/>
                  <meta id="app-token" name="token" content={randomString(10)}/>
                  <meta id="app-date-time" name="date-time" content={iso}/>
                  <meta id="app-base-url" name="base-url" content={baseUrl}/>
                </>}
                endHead={<>
                  {assets.map((asset, i) => {
                    const [file] = asset.split('!');
                    const uri = file.startsWith('/') ? (baseUrl + file) : file;
                    const [name] = file.split('?');
                    if (name.substr(-3) === 'css') {
                      return <link key={i} href={uri} rel="stylesheet" type="text/css"/>;
                    }
                  })}
                  {p.endOfHead}
                </>}
                beginBody={p.beginOfBody}
                endBody={<>
                  <ServerPortal
                    id="system"
                    cipher={cipher}
                    encrypt={true}
                    data={JSON.stringify({
                      delayedPersist: delayedPersist,
                      version: version,
                      locale: context.locale,
                      encrypt: encrypt,
                      storagePrefix: storagePrefix,
                      mode: mode,
                      proxies: forClient,
                      env: envKeys.reduce((acc, key) => {
                        acc[key] = process.env[key];
                        return acc;
                      }, {} as any),
                    })}
                  />
                  {keys.map(key => {
                    return <ServerPortal
                      id={`bridge${key}`}
                      key={key}
                      cipher={cipher}
                      encrypt={encrypt}
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
                </>}
              >
                {!this.isDev() && p.application}
              </Html>
            </StaticRouter>
          </ContextProvider>
        );
        Object.keys(context.cookies).map(key => {
          const cookie = context.cookies[key];
          if (typeof cookie === 'undefined' || cookie === null) {
            res.cookie(key, '', {expires: new Date(0)});
          } else {
            res.cookie(key, cookie);
          }
        });
        res.setHeader('Content-Type', 'text/html;charset=utf-8');
        const hds = routerContext.headers || {};
        Object.keys(hds).forEach(key => res.setHeader(key, hds[key]));
        if (routerContext.url && allowRedirect) {
          res.redirect(routerContext.status || 301, routerContext.url);
          return
        }
        res.statusCode = routerContext.status || 200;
        res.end(wrapHtml(html));
      } catch (e) {
        console.error(e);
        res.statusCode = 500;
        const html = renderToString(
          <Html
            id="log-container"
            endHead={<>
              {assets.map((asset, i) => {
                const [file] = asset.split('!');
                const uri = file.startsWith('/') ? (baseUrl + file) : file;
                const [name] = file.split('?');
                if (name.substr(-3) === 'css') {
                  return <link key={i} href={uri} rel="stylesheet" type="text/css"/>;
                }
                if (name.substr(-2) === 'js' || name.substr(-5) === 'js.gz') {
                  return <script key={i} src={uri} type="application/javascript"/>;
                }
              })}
            </>}>
            {p.failure(e)}
          </Html>
        );
        res.setHeader('Content-Type', 'text/html;charset=utf-8');
        res.statusCode = 500;
        res.end(wrapHtml(html));
      }
    });
  }

  private isDev() {
    return this.options.mode != 'production';
  }
}
