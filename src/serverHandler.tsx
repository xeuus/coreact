import React, { Fragment } from 'react';
import express, { Express, Request, Response } from 'express';
import { renderToString } from 'react-dom/server';
import { RequestContext } from './system';
import { AppContextProvider } from './system/appContext';
import { ServerPortal } from './helpers/serverPortal';
import { Html } from './helpers/html';
import { randomString } from './helpers/random';
import { wrapHtml } from './helpers/wrapHtml';
import { container } from './system/container';
import { AppProvider } from './appProvider';
import { StaticRouter } from 'react-router';

export type ServerHandlerOptions = {
	matches: string[];
	assets: string[];
	gzip?: boolean;
	webpackOptions: any;
	publicDir?: [string, string];
	bundleDir?: [string, string];
	provider: typeof AppProvider;
}
export const serverHandler = (app: Express, options: ServerHandlerOptions) => {
	const { matches, assets, gzip, webpackOptions, provider, publicDir, bundleDir } = options;
	const isDevelopment = process.env.NODE_ENV === 'development';
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
		const bundleUri = baseUrl + bundleDir[0];
		const publicUri = baseUrl + publicDir[0];
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
				publicPath: bundleUri,
			}));
			app.use(require('webpack-hot-middleware')(compiler, {
				log: console.log,
				path: baseUrl + '/__webpackhmr',
				heartbeat: 1000,
			}));
		}


		if (gzip) {
			app.get(new RegExp(`^(${bundleUri}).+(\.js)`), (req, res, next) => {
				const spl = req.url.split('?');
				req.url = spl.length > 1 ? spl.join('.gz?') : `${spl[0]}.gz`;
				res.set('Content-Encoding', 'gzip');
				res.set('Content-Type', 'application/javascript');
				next();
			});
		}

		app.use(bundleUri, express.static(bundleDir[1]));
		app.use(publicUri, express.static(publicDir[1]));

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
				services: {},
				observers: {},
			};
			container.instantiateRequestServices(context);
			const p = new provider(context);
			p.prepare();
			await container.fetchData(context);
			const saltKey = randomString(50);
			const now = new Date().toISOString();
			const cipher = saltKey + now;
			const data = container.gatherData(context);
			const routerContext = {};
			const html = renderToString(
				<AppContextProvider value={context}>
					<StaticRouter basename={baseUrl} location={req.url} context={routerContext}>
						<Html
							id={p.name}
							beginHead={<Fragment>
								{p.beginOfHead}
								<meta id="app-view-state" name="view-state" content={saltKey}/>
								<meta id="app-token" name="token" content={randomString(10)}/>
								<meta id="app-date-time" name="date-time" content={now}/>
								<meta id="app-base-url" name="base-url" content={baseUrl}/>
							</Fragment>}
							endHead={<Fragment>
								{assets.map((asset, i) => {
									const [file, ...spl] = asset.split('!');
									const [name] = file.split('?');
									if (name.substr(-2) === 'js') {
										return <script key={i} src={bundleUri + file} defer={spl.includes('defer')}/>;
									} else if (name.substr(-3) === 'css') {
										return <link key={i} href={bundleUri + file} rel="stylesheet"/>;
									}
								})}
								{p.endOfHead}
							</Fragment>}
							beginBody={<Fragment>
								{p.beginOfBody}
								{Object.keys(data).map(key => <ServerPortal key={key} id={`bridge_${key}`} cipher={cipher} data={JSON.stringify(data[key])}/>)}
							</Fragment>}
							endBody={<Fragment>
								{p.endOfBody}
							</Fragment>}
						>
						{!isDevelopment && p.application}
						</Html>
					</StaticRouter>
				</AppContextProvider>
			);
			res.statusCode = 200;
			res.end(wrapHtml(html));
		});
	});
};
