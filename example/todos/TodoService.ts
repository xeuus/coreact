import {FromUrl, Observable, Order, Persisted, RequestContext, Route, Service, ServiceEvents} from '../../src';
import {routes} from '../routes';
export interface Todo {
  id: number,
  message: string;
  dueDate: string;
  completed: boolean;
}
@Service
@Order(1)
export class TodoService implements ServiceEvents {
  name: string = '';
  @Persisted private counter: number = 0;
  @Persisted @Observable todoList: Todo[] = [];
  selectedDetail: Todo = null;
  addTodo(message: string){
    this.todoList = [...this.todoList, {
      id: this.counter++,
      message: message,
      completed: false,
      dueDate: new Date().toISOString(),
    }];
  };
  deleteTodo(t: Todo){
    this.todoList = this.todoList.filter(a => a.id != t.id);
  };
  completeTodo(t: Todo){
    const copy = Array.from(this.todoList);
    for (let i = 0; i < copy.length; i++) {
      if (copy[i].id == t.id) {
        copy[i].completed = !copy[i].completed;
      }
    }
    this.todoList = copy;
  };
  @Route(routes.todoDetail(), {environment: 'client'})
  async fetchDetail(context: RequestContext) {
    this.selectedDetail = this.todoList.find(a => a.id == context.params.id);
  }
  async serviceDidLoad(context: RequestContext) {
    this.name = 'salam';
  };
}
