import React, { Component, Fragment } from 'react';
import {Route, RouteComponentProps, Switch} from 'react-router';
import {binder, consumer, fetch, inject, observable, observe, Routing, save, service} from '../src';

export type AppProps = {
	name: string;
}

@service
export class Home {
	index: number = 0;
	name: string = 'home';
}


export class Temp extends Component<RouteComponentProps> {
	render() {
		return <div>
			{this.props.match.path}
		</div>;
	}
}

@consumer
export class App extends Component<AppProps> {
	@inject routing = binder.bind(this)(Routing);

	render() {
		return <Fragment>
			<Switch>
				<Route path="/" exact component={Temp}/>
				<Route path="/hello" component={Temp}/>
				<Route path="/aryan" component={Temp}/>
				<Route path="/joke" component={Temp}/>
			</Switch>

			<button onClick={()=>{
				this.routing.goto('/')
			}}>
				go1
			</button>
			<button onClick={()=>{

				this.routing.goto('/hello')
			}}>
				go2
			</button>
			<button onClick={()=>{
				this.routing.goto('/aryan')
			}}>
				go3
			</button>
			<button onClick={()=>{
				this.routing.goto('/hello?joke=12')
			}}>
				go4
			</button>
			<button onClick={()=>{
				this.routing.replace('/joke')
			}}>
				repl
			</button>
		</Fragment>
	}
}
