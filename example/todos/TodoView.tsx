import './styles.sass';
import React, {PureComponent} from 'react';
import {TodoService} from './TodoService';
import {pick, Observer, RequestContext, ScreenEvents, RoutingService, Screen, optional, Client} from "../../src";
import {routes} from "../routes";
import {LocaleService} from "./LocaleService";
import {Assets} from "../assets";

interface StateType {
  message: string,
}

@Screen(routes.todoList, {exact: true, environment: 'server'})
@Observer([TodoService, LocaleService])
export class TodoView extends PureComponent<{}, StateType> implements ScreenEvents {

  todo = pick(TodoService, this);
  router = pick(RoutingService, this);
  locale = pick(LocaleService, this);

  state: StateType = {
    message: '',
  };

  changeText = (message: string) => this.setState({message});


  async screenWillLoad(context: RequestContext) {
    optional(() => context.title = 'hello world');
  }

  render() {
    const {message} = this.state;
    return <div className="todo-page-container">
      <div className="header-container">
        <img src={Assets.Logo} className="logo"/>
        <div className="locale" onClick={() => this.locale.locale = this.locale.locale == 'en' ? 'fa' : 'en'}>
          {this.locale.locale}
        </div>
      </div>

      <div className="todo-wrapper">
        <div className="todo-input-container">
          <input type="text" placeholder="Write something..." value={message}
                 onChange={e => this.changeText(e.target.value)}/>
          <button className="add-todo-button" onClick={() => {
            this.todo.addTodo(message);
            this.setState({message: ''});
          }}>Add
          </button>
        </div>
        <div className="todo-list">
          {this.todo.todoList.map(t => {
            return <div key={t.id} className={`todo-item ${t.completed ? 'completed' : ''}`}>
              <div className="todo-content">
                <a href="#" className="title" onClick={(e) => {
                  e.preventDefault();
                  this.todo.completeTodo(t);
                }}>{t.message}</a>
                <a href="#" className="subtitle" onClick={(e) => {
                  e.preventDefault();
                  this.router.goto(routes.todoDetail(t.id));
                }}>{t.dueDate}</a>
              </div>
              <div className="todo-actions">
                <div className="close" onClick={() => this.todo.deleteTodo(t)}><span/><span/>
                </div>
              </div>
            </div>;
          })}
        </div>
      </div>

    </div>;
  }
}
