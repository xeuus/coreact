import { BaseService } from '../../src/dependencyInjection/baseService';
import { Service } from '../../src/dependencyInjection/service';
import { Observable } from '../../src/observer/observable';
import { Observer } from '../../src/observer/observer';


@Service('request')
export class Lists extends BaseService {
  counter: number = 0;

  showAndNext = () => {
    return this.counter++;
  }
  message = () => {
    console.log('salam')
  }
}
