import { BaseService } from '../../src/dependencyInjection/baseService';
import { Service } from '../../src/dependencyInjection/service';


@Service()
export class Search extends BaseService {
  index: number = 0;
  sayHello = () => {
    return this.index++;
  }
}
