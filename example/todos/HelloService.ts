import {Autowired, Order, RequestContext, Service} from '../../src';
import {TodoService} from "./TodoService";
@Service
@Order(2)
export class HelloService {
  todo = Autowired(TodoService, this);
   async serviceDidLoad(context: RequestContext) {
  }
}
