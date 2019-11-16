import './hello.sass';

import React, {Component, Fragment} from 'react';
import {inject, match, observant, RoutingService, service, Service} from '../src';
import {Route, Switch} from "react-router";
import {Link} from "react-router-dom";

export type AppProps = {
  name: string;
}

@service
export class Home extends Service {
  routingService = inject(RoutingService, this);

  @match('/', {exact: true})
  async hello() {
    console.log('hello')
  }
}

@observant([Home])
export class App extends Component<AppProps> {
  routingService = inject(RoutingService, this);
  home = inject(Home, this);

  render() {
    return <Fragment>
      <Link to="/">goto home</Link>
      <Link to="/hello">goto hello</Link>
      <Switch>
        <Route path="/" exact render={props => <div>Home</div>}/>
        <Route path="/hello" exact render={props => <div>Hello world</div>}/>
      </Switch>
    </Fragment>
  }
}
