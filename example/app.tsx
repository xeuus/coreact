import React, { Component } from 'react';
import { Route, Switch } from 'react-router';
import { observe, service, consumer, binder, save, observable, inject } from '../src';

export type AppProps = {
	name: string;
}

@service
export class Search {
	type = 'Home';

	@save @observable
	index: number = 1;

	name: string = 'search';



	fetch = async () => {
		this.index = 55;
	};



	sayHello = () => {
		this.index++;
	}
}

@service
export class Home {
	type = 'Home';

	search = binder.bind(this)(Search);

	@save
	index: number = 0;

	@save
	name: string = 'home';


	fetch = async () => {
		this.index = 55;
	};

	sayHello = () => {
		this.search.sayHello();
	}
}


@consumer
export class Temp extends Component {
	state = {
		index: 0,
	};

	@inject home: Home = binder.bind(this)(Home);
	@inject search: Search = binder.bind(this)(Search);

	@observe(Search)
	observer = () => {
		this.setState({
			index: this.search.index,
		})
	}

	render() {
		return <div>
			temp {this.search.index} sa;am
			<button onClick={() => this.home.sayHello()}>click</button>
		</div>;
	}
}

@consumer
export class Junk extends Component {
	search = binder.bind(this)(Search);

	render() {
		return <div>
			junk
		</div>;
	}
}


export class App extends Component<AppProps> {
	render() {
		return <Switch>
			<Route path="/temp" component={Temp} />
			<Route path="/junk" component={Junk} />
		</Switch>
	}
}
