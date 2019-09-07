import React, { Component } from 'react';
import { Route, Switch } from 'react-router';
import { binder, consumer, fetch, inject, observable, observe, save, service } from '../src';

export type AppProps = {
	name: string;
}

@service
export class Home {
	@fetch(async function () {
		return 34;
	})
	index: number = 0;

	@fetch(async function () {
		this.hello = 23;
		return 'as Nolan';
	})
	name: string = 'home';


	@save @observable hello: string = '234';
}


@consumer
export class Temp extends Component {
	state = {
		index: 0,
	};
	@inject home: Home = binder.bind(this)(Home);

	@observe(Home)
	observer = (key:string, value: any)=>{
		console.log(key, value);
	}

	render() {
		return <div>
			<button onClick={()=>this.home.hello = Math.random().toString()}>click</button>
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
