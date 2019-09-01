import React, { Component } from 'react';
import { Search } from './services/search';
import { Consumer, Inject, Observer } from '../../src';
import { Link } from 'react-router-dom';
import { Home } from './services/home';

export type TempProps = {}

export type TempState = {
	name: string;
}

@Consumer
export class Temp extends Component<TempProps, TempState> {
	state: TempState = {
		name: null,
	};

	@Inject(Search)
	search: Search;

	@Inject(Home)
	home: Home;


	@Observer(Search)
	observer(state: any) {
		this.setState({
			name: this.search.name,
		});
	}

	render() {
		return <div>
			<button onClick={this.home.search.sayHello}>click</button>
			{this.search.name}
			<Link to="/test/">test</Link>
		</div>;
	}
}
