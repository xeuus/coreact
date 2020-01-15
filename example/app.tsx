import React, {PureComponent} from 'react';
import {TodoView} from './todos/TodoView';
import {TodoDetail} from './todos/TodoDetail';
import {Redirected, Routed, Switched} from "../src/service";

export class App extends PureComponent {
  render() {
    return <>
      <Switched>
        <Routed screen={TodoView}/>
        <Routed screen={TodoDetail}/>
        <Redirected from="*" to="/"/>
      </Switched>
    </>
  }
}
