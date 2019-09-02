import React, { Component } from 'react';
import { Consumer, Inject } from '../../src';
import { Route, Switch } from 'react-router';
import { Temp } from './temp';
import { Routing } from '../../src/router';
import { Junk } from './junk';


export type AppProps = {
	name: string;
}

@Consumer
export class App extends Component<AppProps> {
	@Inject('Routing')
	routing: Routing;

	render() {
		const { name } = this.props;
		return <Switch>
			<Route path="/aryan" component={Temp}/>
			<Route path="/test" component={Junk}/>
		</Switch>
	}
}
