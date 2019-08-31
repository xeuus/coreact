import { BaseService } from '../../src/dependencyInjection/baseService';
import { Service } from '../../src/dependencyInjection/service';


@Service('Lists')
export class Lists extends BaseService {
  counter: number = 0;

  showAndNext = () => {
    return this.counter++;
  }

  message = () => {
    console.log('salam')
  }
}
