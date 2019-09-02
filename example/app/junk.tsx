import React, { Component } from 'react';
import { Search } from './services/search';
import { Consumer, Inject, Observer } from '../../src';
import { Link } from 'react-router-dom';
import { Home } from './services/home';

export type JunkProps = {}

export type JunkState = {
	name: string;
}

@Consumer
export class Junk extends Component<JunkProps, JunkState> {
	state: JunkState = {
		name: null,
	};

	@Inject('Home')
	home: Home;

	@Inject('Search')
	search: Search;



	@Observer(Search)
	observer(state: any) {
		this.setState({
			name: this.search.name,
		});
	}

	render() {
		return <div>
			<button onClick={this.home.sayHello}>click</button>
			{this.search.name}
			<Link to="/aryan/">aryan</Link>
			<button onClick={()=>this.home.goto('/aryan/')}>goto</button>
		</div>;
	}
}
