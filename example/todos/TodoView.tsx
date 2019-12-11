import './styles.sass';
import React, { PureComponent } from 'react';
import { Todo, TodoService } from './TodoService';
import {Autowired, Observer, RoutingService} from "../../src";
import {routes} from "../routes";

interface StateType {
  message: string,
}

@Observer([TodoService])
export class TodoView extends PureComponent<{}, StateType> {

  todo = Autowired(TodoService, this);
  router = Autowired(RoutingService, this);

  state: StateType = {
    message: '',
  };

  changeText = (message: string) => this.setState({ message });

  render() {
    const { message } = this.state;
    return <div className="todo-page-container">
      <div className="todo-wrapper">
        <div className="todo-input-container">
          <input type="text" placeholder="Write something..." value={message} onChange={e => this.changeText(e.target.value)}/>
          <button className="add-todo-button" onClick={()=>{
            this.todo.addTodo(message);
            this.setState({message:''});
          }}>Add</button>
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
