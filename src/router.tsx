import React, { Component } from 'react';
import { BaseService, Consumer, Inject, Observable, Observer, RequestContext, Service } from './system';
import { Router } from 'react-router';
import { Action, History, Location } from 'history/';


export type RoutingState = {
	location: Location; action: Action; isFirstRendering: boolean;
}

@Service('Routing')
export class Routing extends BaseService {
	history: History;

	@Observable()
	state: RoutingState;

	constructor(context: RequestContext) {
		super(context);
	}
	push = (path: string) => {
		this.history.push(path);
	};
}

export type ConnectedRouterProps = {
	history: History;
}

@Consumer
export class ConnectedRouter extends Component<ConnectedRouterProps> {
	unsubscribe: any = null;
	inTimeTravelling: boolean = false;

	@Inject('Routing')
	routing: Routing;

	constructor(props: ConnectedRouterProps) {
		super(props);
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

	@Observer(Routing, 'state')
	observer() {
		const {history} = this.props;
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
