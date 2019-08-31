import { BaseService } from '../../src/dependencyInjection/baseService';
import { Service } from '../../src/dependencyInjection/service';


@Service('Hello')
export class Hello extends BaseService {

}
