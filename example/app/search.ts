import {BaseService} from '../../src/models/baseService';
import {Service} from '../../src/models/service';


@Service
export class Search extends BaseService {
  index = 0;

  sayHello = () => {
    return this.index++;
  }
}
