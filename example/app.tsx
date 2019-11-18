import './hello.sass';

import React, {Component} from 'react';
import {AutoWired, MatchResult, Observable, Observer, Persisted, RequestContext, Route, Service} from '../src';
import {Link} from "react-router-dom";

export type AppProps = {
  name: string;
}


@Service
export class Home {
  @Persisted @Observable data: string = 'name!';
  @Observable hello: string = 'world';

  @Route('/hello/:name')
  async ok(a: RequestContext, match: MatchResult) {
    console.log(match.params)
  }
}


@Observer([Home])
export class App extends Component<AppProps> {

  home = AutoWired(Home, this);

  render() {
    return <>
      <div>hello <b className="temp-class">{this.home.data}</b></div>
      <div>hello <b className="temp-class">{this.home.hello}</b></div>
      <button onClick={() => {
        this.home.data = Math.random().toString();
      }}>Hello
      </button>
      <Link to="/hello/aryan/">Goto</Link>
      <div><img src={require('./instagram.png')} alt=""/></div>
    </>
  }
}
