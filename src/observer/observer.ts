import { BaseService } from "src/dependencyInjection/baseService";

export function Observer<T extends typeof BaseService>(context?: T) {
	return function (target: any, key: string) {
		Object.defineProperty(target, '__observer__' + key, {
			writable: false,
			value: context ? (context as any).__identifier__ : null,
			configurable: false,
			enumerable: false
		})
	}
}