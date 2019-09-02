import { BaseService, Observable, RequestContext, Service, Inject } from '../../../src';
import { Home } from './home';

@Service('Search')
export class Search extends BaseService {


	@Inject('Home')
	search: Home = null;

	@Observable()
	index: number = 0;

	@Observable()
	name: string = 'aryan';

	constructor(context: RequestContext) {
		super(context);
	}

	preload = async () => {
		this.index = 454;
		this.name = 'Parisa';
	};

	sayHello = () => {
		this.name = Math.random().toString();
	};
}
