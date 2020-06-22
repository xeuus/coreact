import {pick, debounced, observable, Order, piped, RequestContext, route, Bean} from '../../src';
import {routes} from '../routes';
import {Networking} from "./Networking";

export interface Todo {
  id: number,
  message: string;
  dueDate: string;
  completed: boolean;
}

@Bean
@Order(1)
export class TodoService {
  net = pick(Networking, this);

  @piped @observable todoList: Todo[] = [];
  @piped @observable currentTodo: Todo = null;


  async addTodo(message: string) {
    const response = await this.net.POST<Todo>('/todos', {
      message
    });
    this.todoList = [...this.todoList, response.payload];
  };
  async deleteTodo(todo: Todo) {
    await this.net.DELETE('/todos', {id: todo.id});
    this.todoList = this.todoList.filter(a => a.id != todo.id);
  };

  async completeTodo(todo: Todo) {
    const response = await this.net.PUT<Todo>('/todos/complete', {id: todo.id});
    this.todoList = this.todoList.map(a => a.id == todo.id ? response.payload : a);
    this.currentTodo = response.payload;
  };

  @route(routes.todoList, {exact: true})
  @debounced(200)
  async fetchTodosFromServer() {
    const response = await this.net.GET<Todo[]>('/todos');
    this.todoList = response.payload;
  }

  @route(routes.todoDetail(), {exact: true})
  @debounced(200)
  async fetchDetail(context: RequestContext) {
    const response = await this.net.GET<Todo>('/todos/detail', {id: context.params.id});
    this.currentTodo = response.payload;
  }
}
