import React, { Component } from 'react';
import { Router } from 'react-router';
import { Action, History, Location } from 'history';
import { match } from './helpers/match';
import { service, observable, consumer, inject, binder, observe } from './service';


export type RoutingState = {
	location: Location; action: Action; isFirstRendering: boolean;
}

export type ConnectedRouterProps = {
	history: History;
}

@service
export class Routing {
	@observable
	state: RoutingState;
	history: History;

	get href() {
		return this.state.location.pathname + this.state.location.search;
	}
	set href(path: string){
		this.history.push(path);
	}

	get pathname() {
		return this.state.location.pathname;
	}
	get search() {
		return this.state.location.search;
	}
	get hash() {
		return this.state.location.hash;
	}
	get key() {
		return this.state.location.key;
	}

	match = (pattern: string, options: { exact?: boolean, sensitive?: boolean, strict?: boolean } = {}) => {
		const { exact = true, sensitive = false, strict = false } = options;
		return match(this.href, {
			exact, sensitive, strict,
			path: pattern,
		})
	}
}


@consumer
export class ConnectedRouter extends Component<ConnectedRouterProps> {
	unsubscribe: any = null;
	inTimeTravelling: boolean = false;

	@inject routing = binder.bind(this)(Routing)

	constructor(props: ConnectedRouterProps, context: any) {
		super(props, context);
		const { history } = props;
		this.routing.history = history;
		const handleLocationChange = (location: Location, action: Action, isFirstRendering = false) => {
			if (!this.inTimeTravelling) {
				this.routing.state = {
					action,
					location,
					isFirstRendering,
				};
			} else {
				this.inTimeTravelling = false;
			}
		};
		this.unsubscribe = history.listen(handleLocationChange);
		handleLocationChange(history.location, history.action, true);
	}

	componentWillUnmount(): void {
		this.unsubscribe && this.unsubscribe();
	}

	@observe(Routing)
	observer = () => {
		const { history } = this.props;
		const {
			pathname: pathnameInStore,
			search: searchInStore,
			hash: hashInStore,
		} = this.routing.state.location;
		const {
			pathname: pathnameInHistory,
			search: searchInHistory,
			hash: hashInHistory,
		} = history.location

		if (pathnameInHistory !== pathnameInStore || searchInHistory !== searchInStore || hashInHistory !== hashInStore) {
			this.inTimeTravelling = true
			history.push({
				pathname: pathnameInStore,
				search: searchInStore,
				hash: hashInStore,
			})
		}

	}

	render() {
		const { history, children } = this.props;
		return <Router history={history}>
			{children}
		</Router>;
	}
}
