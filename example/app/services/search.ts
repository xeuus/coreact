import { BaseService, Observable, RequestContext, Service } from '../../../src';

@Service('Search')
export class Search extends BaseService {
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
