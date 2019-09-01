import { BaseService, Inject, RequestContext, Service } from '../../../src';
import { Search } from './search';

@Service('Home')
export class Home extends BaseService {
	search:Search = null;
	constructor(context: RequestContext) {
		super(context);
		this.search = new Search(context);
	}
}
