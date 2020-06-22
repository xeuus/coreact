import React, {PureComponent} from 'react';
import './todos/TodoView';
import './todos/TodoDetail';
import {Grouped, Redirected} from "../src/service";

export class App extends PureComponent {
  render() {
    return <>
      <Grouped>
        <Redirected from="*" to="/"/>
      </Grouped>
    </>
  }
}
