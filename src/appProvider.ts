import { ReactNode } from 'react';
import { RequestContext } from './service';

export class AppProvider {
	context: RequestContext = null;
	name: string = 'app';
	storagePrefix?: string = 'service';
	splash: ReactNode = null;
	application: ReactNode = null;
	beginOfHead: ReactNode = null;
	endOfHead: ReactNode = null;
	beginOfBody: ReactNode = null;
	endOfBody: ReactNode = null;

	constructor(context: RequestContext) {
		this.application = null;
		this.splash = null;
		this.beginOfHead = null;
		this.endOfHead = null;
		this.beginOfBody = null;
		this.endOfBody = null;
		this.context = context;
	}

	async before() {
	}
	async client() {
	}
	async server(req: any, res: any) {
	}
	async after() {
	}
}
