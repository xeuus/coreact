import React, {Component} from 'react';
import {Search} from "./search";
import {AppContextConsumer, ApplicationContext} from "../../src/appContext";
import {AutoWire} from "../../src/models/autoWire";
import {ViewLayer} from "../../src/models/viewLayer";
import {Hello} from "./hello";

export type AppProps = {
  name: string;
  ____context?: ApplicationContext;
}


@ViewLayer
export class App extends Component<AppProps> {
  search = AutoWire.bind(this)(Search);
  hello = AutoWire.bind(this)(Hello);

  render() {
    return <div>
      Hello World
      <b>{this.search.sayHello()}</b>
      <b>{this.search.sayHello()}</b>
      <b>{this.search.sayHello()}</b>
      <AppContextConsumer>{context => <div>{context.url}</div>}</AppContextConsumer>
    </div>
  }
}
