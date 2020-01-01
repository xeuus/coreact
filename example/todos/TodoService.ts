import {Autowired, Debounced, Observable, Order, Piped, RequestContext, Route, Service, Timer} from '../../src';
import {routes} from '../routes';
import {Networking} from "./Networking";
import {TimerFunc} from "../../src/service";

export interface Todo {
  id: number,
  message: string;
  dueDate: string;
  completed: boolean;
}

@Service
@Order(1)
export class TodoService {
  net = Autowired(Networking, this);

  @Piped @Observable todoList: Todo[] = [];
  @Piped @Observable currentTodo: Todo = null;


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

  @Route(routes.todoList, {exact: true})
  @Debounced(200)
  async fetchTodosFromServer() {
    const response = await this.net.GET<Todo[]>('/todos');
    this.todoList = response.payload;
  }

  @Route(routes.todoDetail(), {exact: true})
  @Debounced(200)
  async fetchDetail(context: RequestContext) {
    const response = await this.net.GET<Todo>('/todos/detail', {id: context.params.id});
    this.currentTodo = response.payload;
  }
}
