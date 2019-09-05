import React, { Component } from 'react';
import { Route, Switch } from 'react-router';
import { observe, service, consumer, binder, save, observable, inject, fetch } from '../src';

export type AppProps = {
	name: string;
}

@service
export class Home {
	@save @fetch(async (context) => 34)
	index: number = 0;

	@save @fetch(async (context) => '23')
	name: string = 'home';
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
			<Route path="/" component={Temp} />
		</Switch>
	}
}
