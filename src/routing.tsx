import React, {Component, PureComponent} from 'react';
import {Router} from 'react-router';
import {Action, createBrowserHistory, History, Location, createMemoryHistory} from 'history';
import {match} from './helpers/match';
import {service, observable, consumer, inject, binder, observe} from './service';
import {baseUrl} from "./helpers/viewState";


export type RoutingState = {
	location: Location;
	action: Action;
	isFirstRendering: boolean;
}

export type ConnectedRouterProps = {}

@service
export class Routing {
	@observable state: RoutingState = {
		location: {
			pathname: '',
			state: undefined,
			search: '',
			hash: '',
			key: '',
		},
		action: null,
		isFirstRendering: true,
	};
	history: History;
	inTimeTravelling: boolean = false;
	jump: string = '';

	get href() {
		return this.state.location.pathname + this.state.location.search;
	}

	set href(path: string) {
		const a = path.split('?');
		this.state = {
			...this.state,
			action: 'PUSH',
			location: {
				...this.state.location,
				pathname: a[0],
				search: a[1] ? `?${a[1]}` : '',
			}
		}
	}

	get pathname() {
		return this.state.location.pathname;
	}

	get search() {
		return this.state.location.search;
	}

	goto(path: string) {
		this.href = path;
	}

	replace(path: string, back: any = 0) {
		this.jump = path;
		if(back < 1){
			const a = path.split('?');
			this.state = {
				isFirstRendering: false,
				action: 'REPLACE',
				location: {
					...this.state.location,
					pathname: a[0],
					search: a[1] ? `?${a[1]}` : '',
				}
			};
		}else {
			this.history.go(-back);
		}
	}

	match = (pattern: string, options: { exact?: boolean, sensitive?: boolean, strict?: boolean } = {}) => {
		const {exact = true, sensitive = false, strict = false} = options;
		return match(this.href, {
			exact, sensitive, strict,
			path: pattern,
		})
	}
}


@consumer
export class ConnectedRouter extends PureComponent<ConnectedRouterProps> {
	unsubscribe: any = null;

	@inject routing = binder.bind(this)(Routing);

	constructor(props: ConnectedRouterProps, context: any) {
		super(props, context);
		const history = createBrowserHistory({
			basename: baseUrl,
		});
		this.routing.history = history;
		const handleLocationChange = (location: Location, action: Action, isFirstRendering = false) => {
			if(this.routing.jump){
				const path = this.routing.jump;
				this.routing.jump = '';
				const a = path.split('?');
				this.routing.state = {
					isFirstRendering: false,
					action: 'REPLACE',
					location: {
						...location,
						pathname: a[0],
						search: a[1] ? `?${a[1]}` : '',
					}
				};
			}
			if (!this.routing.inTimeTravelling) {
				this.routing.state = {
					action,
					location,
					isFirstRendering,
				};
			} else {
				this.routing.inTimeTravelling = false;
			}
		};
		this.unsubscribe = history.listen(handleLocationChange);
		handleLocationChange(history.location, history.action, true);
	}

	@observe(Routing)
	observer = () => {
		const history = this.routing.history;
		const {
			pathname: pathnameInStore,
			search: searchInStore,
			hash: hashInStore,
		} = this.routing.state.location;
		const {
			pathname: pathnameInHistory,
			search: searchInHistory,
			hash: hashInHistory,
		} = history.location;

		if (pathnameInHistory !== pathnameInStore || searchInHistory !== searchInStore || hashInHistory !== hashInStore) {
			this.routing.inTimeTravelling = true;
			history[this.routing.state.action == 'PUSH' ? 'push' : 'replace']({
				pathname: pathnameInStore,
				search: searchInStore,
				hash: hashInStore,
			})
		}
	};

	componentWillUnmount(): void {
		this.unsubscribe && this.unsubscribe();
	}

	render() {
		const {children} = this.props;
		const history = this.routing.history;
		return <Router history={history}>
			{children}
		</Router>;
	}
}
