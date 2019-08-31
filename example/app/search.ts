import { BaseService } from '../../src/dependencyInjection/baseService';
import { Service } from '../../src/dependencyInjection/service';
import { Observable } from '../../src/observer/observable';
import { Observer } from '../../src/observer/observer';


@Service()
export class Search extends BaseService {
  @Observable()
  index: number = 0;

  @Observable()
  name: string = 'aryan';


  sayHello = () => {
    this.index++;
  }
}
