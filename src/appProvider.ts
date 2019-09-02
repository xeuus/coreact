import { ReactNode } from 'react';
import { RequestContext } from './system';

export class AppProvider {
	name: string = 'app';
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
	}

	public prepare() {
	}
}
