import React from 'react';
import { hydrate, render } from 'react-dom';
import { AppProvider } from './appProvider';
import { ViewHolder } from './helpers/viewHolder';
import { container } from './system/container';
import { AppContextProvider } from './system/appContext';
import { RequestContext } from './system';
import { baseUrl } from './helpers/viewState';
import {createBrowserHistory} from 'history';
import { ConnectedRouter } from './router';

export const clientHandler = (provider: typeof AppProvider): (() => any) => {
	const context: RequestContext = {
		url: window.location.pathname + window.location.search,
		services: {},
		observers: {},
	};
	container.instantiateRequestServices(context);
	Object.seal(context);

	const p = new provider(context);
	p.prepare();
	const element = document.getElementById(p.name);

	const history = createBrowserHistory({
		basename: baseUrl,
	});
	const app = <ViewHolder
		process={async () => {
			container.restoreData(context);
			await container.fetchData(context);
		}}>{
		() => <AppContextProvider value={context}>
			<ConnectedRouter history={history}>
				{p.application}
			</ConnectedRouter>
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
