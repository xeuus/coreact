import React from 'react';
import { hydrate, render } from 'react-dom';
import { AppProvider } from './appProvider';
import { ViewHolder } from './helpers/viewHolder';
import {
	RequestContext,
	registerServices,
	ContextProvider,
	restoreDataOnClientSide,
	restorePersistedDataOnClientSide,
	registerPersistClient,
	gatherAsyncProperties,
	gatherMethods
} from './service';
import { baseUrl, dateTime } from './helpers/viewState';
import {createBrowserHistory} from 'history';
import { ConnectedRouter } from './routing';
import { UserAgent } from 'express-useragent';

export function parseQuery(queryString: string) {
	const query: any = {};
	const pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
	for (let i = 0; i < pairs.length; i++) {
		const pair = pairs[i].split('=');
		query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
	}
	return query;
}
export function parseCookie(cookies: string) {
	return cookies.split(';').reduce<any>((obj, cookieString) => {
		const splitCookie = cookieString.split('=').map(cookiePart => cookiePart.trim() );
		try {
			obj[splitCookie[0]] = JSON.parse(splitCookie[1])
		} catch (error) {
			obj[splitCookie[0]] = splitCookie[1]
		}
		return obj
	}, {});
}

export const clientHandler = (provider: typeof AppProvider): (() => any) => {
	let proto = window.location.protocol;
	const idx = proto.indexOf(':');
	proto = proto.substr(0, idx);
	const context: RequestContext = {

		url: window.location.pathname + window.location.search,
		body: {},
		query: parseQuery(window.location.search),
		method: 'GET',
		hostname: window.location.hostname,
		cookies: parseCookie(window.document.cookie),
		protocol: proto,
		headers: {},
		useragent: new UserAgent().parse(window.navigator.userAgent),

		baseUrl,
		dateTime: new Date(dateTime),
		services: [],
		environment: 'client',

	};
	registerServices(context);

	const p = new provider(context);

	const element = document.getElementById(p.name);

	const app = <ViewHolder
		process={async () => {
			restoreDataOnClientSide(context);
			await gatherMethods(context, 'clientBeforeAny');
			await p.before();
			context.storagePrefix = p.storagePrefix;
			registerPersistClient(context);
			restorePersistedDataOnClientSide(context);
			await gatherMethods(context, 'onClientLoad');
			await gatherAsyncProperties(context);
			await p.client();
			await p.after();
			await gatherMethods(context, 'afterClientLoaded');
		}}>{
		() => <ContextProvider context={context}>
			<ConnectedRouter>
				{p.application}
			</ConnectedRouter>
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
