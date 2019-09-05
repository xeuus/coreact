import React, { Component } from 'react';
import { Route, Switch } from 'react-router';
import { binder, consumer, inject } from '../src';
import { Home } from './services';

export type AppProps = {
	name: string;
}

@consumer
export class Temp extends Component {
	state = {
		index: 0,
	};
	@inject home: Home = binder.bind(this)(Home);

	render() {
		return <div>
			<div>{this.home.index}</div>
			<div>{this.home.name}</div>
		</div>;
	}
}

export class App extends Component<AppProps> {
	render() {
		return <Switch>
			<Route path="/" component={Temp}/>
		</Switch>
	}
}
