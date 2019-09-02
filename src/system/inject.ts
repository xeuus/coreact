import { BaseService } from './baseService';
import { RequestContext } from './requestContext';

export function Inject<T extends BaseService>(cls: { new(context: RequestContext): T } | string) {
	
	return (target: any, key: string): any => {
		console.log(key, cls);
		const id = typeof  cls === 'string' ? cls : (cls as any).__identifier__;
		Object.defineProperty(target, '__service__' + key, {
			writable: false,
			value: id,
			configurable: false,
			enumerable: false
		});
	};
}
