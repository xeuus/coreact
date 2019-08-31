import React, { Fragment, Component } from 'react';
import { Search } from "./search";
import { Inject } from "../../src/dependencyInjection/inject";
import { Consumer } from "../../src/dependencyInjection/consumer";
import { Observer } from '../../src/observer/observer';
import { Lists } from './lists';


export type TempProps = {
}

export type TempState = {
  index: number;
}

@Consumer
export class Temp extends Component<TempProps, TempState> {
  state: TempState = {
    index: 0,
  }

  @Inject(Search) search: Search;

  @Inject(Lists) lists: Lists;

  @Observer(Search)
  observer(state: any) {
    console.log(state);
    this.setState({
      index: this.search.index,
    })
  }

  render() {
    return <div>
      Hello {this.search.index}
      <button onClick={() => this.lists.message()}>show</button>
    </div>
  }
}
