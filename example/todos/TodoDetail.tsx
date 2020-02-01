import React, {PureComponent} from 'react';
import {Autowired, Observer, optional, RequestContext, RoutingService, Screen, ScreenEvents} from '../../src';
import {TodoService} from './TodoService';
import {routes} from "../routes";

@Screen(routes.todoDetail(), {exact: true})
@Observer([TodoService])
export class TodoDetail extends PureComponent implements ScreenEvents{
  todo = Autowired(TodoService, this);
  router = Autowired(RoutingService, this);

  async screenWillLoad(context: RequestContext) {
    optional(() => context.title = this.todo.currentTodo.message);
  }

  render() {
    const todo = this.todo.currentTodo;
    return <div className="todo-page-container">
      <div className="todo-wrapper">
        {todo && <div className="todo-list">
          <div className={`todo-item ${todo.completed ? 'completed' : ''}`}>
            <div className="todo-content">
              <a href="#" className="title" onClick={(e) => {
                e.preventDefault();
                this.todo.completeTodo(todo);
              }}>{todo.message}</a>
              <a href="#" className="subtitle" onClick={(e) => {
                e.preventDefault();
              }}>{todo.dueDate}</a>
            </div>
            <div className="todo-actions">
              <div className="close" onClick={() => {
                this.todo.deleteTodo(todo);
                this.router.rewind()
              }}><span/><span/>
              </div>
            </div>
          </div>
        </div>}
      </div>
    </div>
  }
}

