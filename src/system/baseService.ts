import { RequestContext } from './requestContext';

export interface ServiceProtocol {
	context: RequestContext;
	mount: () => any;
	unmount: () => any;
	preload: () => Promise<any>;
}

export class BaseService implements ServiceProtocol {
	context: RequestContext;

	constructor(context: RequestContext) {
		this.context = context;
	}

	async preload() {
	}

	mount() {
	}

	unmount() {
	}
}
