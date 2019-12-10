import React, { PureComponent } from 'react';
import { TodoView } from './todos/TodoView';
import { Route, Switch } from 'react-router';
import { routes } from './routes';
import { TodoDetail } from './todos/TodoDetail';

export class App extends PureComponent {
  render() {
    return <>
      <Switch>
        <Route path={routes.todoList} component={TodoView} exact/>
        <Route path={routes.todoDetail()} component={TodoDetail} exact/>
      </Switch>
    </>
  }
}
