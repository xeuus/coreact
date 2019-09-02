import { BaseService, Inject, RequestContext, Service } from '../../../src';
import { Search } from './search';
import { Routing } from '../../../src/router';

@Service('Home')
export class Home extends BaseService {
	
	@Inject('Search')
	search: Search = null;

	@Inject('Routing')
	routing: Routing = null;

	fun= ()=>{
		console.log('fun');
	}
		
	goto = (path: string)=>{
		this.routing.push(path)
	}

	sayHello = () => {
		this.search.sayHello();
	}

}
