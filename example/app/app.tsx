import React, { Fragment, Component } from 'react';
import { Search } from "./search";
import { Hello } from "./hello";
import { Inject } from "../../src/dependencyInjection/inject";
import { Consumer } from "../../src/dependencyInjection/consumer";


export type AppProps = {
  name: string;
}


@Consumer
export class App extends Component<AppProps> {
  @Inject(Search) search: Search;
  @Inject(Hello) hello: Hello;

  render() {
    const {name} = this.props;
    return <div>
      <div>Hello {name}</div>
      {this.search && <ul>
        <li>{this.search.sayHello()}</li>
        <li>{this.search.sayHello()}</li>
        <li>{this.search.sayHello()}</li>
        <li>{this.search.sayHello()}</li>
      </ul>}
    </div>
  }
}
