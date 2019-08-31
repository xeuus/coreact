import React, { Fragment, Component } from 'react';
import { Search } from "./search";
import { Inject } from "../../src/dependencyInjection/inject";
import { Consumer } from "../../src/dependencyInjection/consumer";
import { Temp } from './temp';


export type AppProps = {
  name: string;
}

@Consumer
export class App extends Component<AppProps> {
  @Inject(Search) search: Search;

  render() {
    const { name } = this.props;
    return <div>
      <div>Hello {name}</div>
      <button onClick={this.search.sayHello}>click</button>
      <Temp/>
    </div>
  }
}
