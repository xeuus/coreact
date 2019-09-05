import React, { Fragment } from 'react';
import express, { Express, Request, Response } from 'express';
import { renderToString } from 'react-dom/server';
import { Html } from './helpers/html';
import { randomString } from './helpers/random';
import { wrapHtml } from './helpers/wrapHtml';
import { StaticRouter } from 'react-router';
import httpProxy from 'http-proxy';
import { register } from './webpack';
import { ContextProvider, extractDataOnServerSide, gatherAsyncProperties, registerServices, RequestContext } from './service';
import { ServerPortal } from './helpers/serverPortal';

export type ServerHandlerOptions = {
	match: string;
	assets: string[];
	enableGzip?: boolean;
	webpackOptions: any;
	proxy?: string;
	apiPrefix?: string;
	publicDir?: [string, string];
	bundleDir?: [string, string];
	root: string;
	provider: string;
}
export const serverHandler = (app: Express, options: ServerHandlerOptions) => {
	const { match, apiPrefix = '/api', proxy, root, assets, enableGzip, webpackOptions, provider, publicDir, bundleDir } = options;
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


	const reset = register(root, bundleUri);
	const Provider = require(provider).default;

	const api = baseUrl + apiPrefix;
	if (proxy) {
		app.all(`${api}*`, (req, res) => {
			req.url = req.url.substr(api.length);
			return proxyServer.proxyRequest(req, res, {
				changeOrigin: true,
				target: proxy,
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
			publicPath:  webpackOptions.output.publicPath,
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
	app.use(publicUri, express.static(publicDir[1]), notFound);

	if (enableGzip && !isDevelopment) {
		app.get(new RegExp(`^(${bundleUri}).+(.js\\?|.js$)`), (req, res, next) => {
			const spl = req.url.split('?');
			req.url = spl.length > 1 ? spl.join('.gz?') : `${spl[0]}.gz`;
			res.set('Content-Encoding', 'gzip');
			res.set('Content-Type', 'application/javascript');
			next();
		});
	}

	app.use(bundleUri, express.static(bundleDir[1]), notFound);


	app.get(match, (req: Request, res: Response, next) => {
		if (!req.path.startsWith(api) && req.path.substr(-1) !== '/') {
			const query = req.url.slice(req.path.length);
			res.redirect(301, `${req.path}/${query}`);
		} else {
			next();
		}
	});
	app.get(match, async (req: Request, res: Response) => {
		const now = new Date();
		const context: RequestContext = {
			url: req.url,
			services: [],
			dateTime: now,
			baseUrl: baseUrl,
			environment: 'server',
		};
		registerServices(context);

		const p = new Provider(context);
		await p.before();
		await gatherAsyncProperties(context);
		await p.server();
		await p.after();
		const saltKey = randomString(50);
		const iso = now.toISOString();
		const cipher = saltKey + iso;
		const data = extractDataOnServerSide(context);
		const keys = Object.keys(data);
		const routerContext = {};
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
						</Fragment>}
						endHead={<Fragment>
							{assets.map((asset, i) => {
								const [file, ...spl] = asset.split('!');
								const uri = file.startsWith('/') ? (baseUrl + file) : file;
								const [name] = file.split('?');
								if (name.substr(-2) === 'js') {
									return <script key={i} src={uri} defer={spl.includes('defer')}/>;
								} else if (name.substr(-3) === 'css') {
									return <link key={i} href={uri} rel="stylesheet"/>;
								}
							})}
							{p.endOfHead}
						</Fragment>}
						beginBody={<Fragment>
							{p.beginOfBody}
						</Fragment>}
						endBody={<Fragment>
							{p.endOfBody}
							{keys.map(key => {
								return <ServerPortal
									id={`bridge${key}`}
									key={key}
									cipher={cipher}
									data={JSON.stringify(data[key])}
								/>;
							})}
						</Fragment>}
					>
					{!isDevelopment && p.application}
					</Html>
				</StaticRouter>
			</ContextProvider>
		);
		res.statusCode = 200;
		res.end(wrapHtml(html));
	});

	//reset();
};
