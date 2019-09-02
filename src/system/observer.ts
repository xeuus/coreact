import { BaseService } from '../system/baseService';

export function Observer<T extends typeof BaseService>(context?: T | string, type?: keyof T['prototype']) {
	return function (target: any, key: string) {
		const actualKey = (typeof context === 'string') ? context : type;
		Object.defineProperty(target, '__observer__' + key, {
			writable: false,
			value: {
				service: context ? (context as any).__identifier__ :null,
				key: actualKey,
			},
			configurable: false,
			enumerable: false
		});
	};
}
