import React from 'react';
import { hydrate, render } from 'react-dom';
import { AppProvider } from './appProvider';
import { ViewHolder } from './helpers/viewHolder';
import { RequestContext, registerServices, ContextProvider, restoreDataOnClientSide, restorePersistedDataOnClientSide, registerPersistClient, gatherAsyncProperties } from './service';
import { baseUrl, dateTime } from './helpers/viewState';
import {createBrowserHistory} from 'history';
import { ConnectedRouter } from './routing';

export const clientHandler = (provider: typeof AppProvider): (() => any) => {
	const context: RequestContext = {
		baseUrl,
		dateTime: new Date(dateTime),
		url: window.location.pathname + window.location.search,
		services: [],
		environment: 'client',

	};
	registerServices(context);

	const p = new provider(context);

	const element = document.getElementById(p.name);

	const history = createBrowserHistory({
		basename: baseUrl,
	});
	const app = <ViewHolder
		process={async () => {
			restoreDataOnClientSide(context);

			await p.before();
			context.storagePrefix = p.storagePrefix;
			registerPersistClient(context);
			restorePersistedDataOnClientSide(context);
			await gatherAsyncProperties(context);
			await p.client();
			await p.after();
		}}>{
		() => <ContextProvider context={context}>
			<ConnectedRouter history={history}>
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
