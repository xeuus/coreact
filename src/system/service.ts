import { BaseService } from './baseService';
import { container } from './container';
import { ServiceType } from './serviceType';
import { RequestContext } from './requestContext';
import { Bus } from './bus';

export function Service<T extends typeof BaseService>(name: string, type: ServiceType = 'request') {
	return (service: T) => {
		const original = service;
		const f: any = function (...args: any[]) {
			const context = args[0] as RequestContext;
			const id = this.__identifier__;

			const instance = new (service as any)(context);
			context.observers[id] = context.observers[id] || new Bus();
			const bus = context.observers[id] as Bus;

			const unsubscribes = <Function[]>[];
			const mounts = <Function[]>[];
			const unmounts = <Function[]>[];
			setTimeout(()=>{
				Object.getOwnPropertyNames(service.prototype).forEach((key: string) => {
					if (key.indexOf('__service__') === 0) {
						const actualKey = key.substr(11);
						const id = (service.prototype as any)[key];
						const Service = container.services[id] as (typeof BaseService);
						const { __serviceType__ } = Service as any;
						let instance = null;
						switch (__serviceType__) {
							case 'request':
								instance = context.services[id] as BaseService;
								break;
							case 'singleton':
								instance = container.singletons[id] as BaseService;
								break;
							case 'prototype':
								instance = new Service(context);
								mounts.push(instance.mount);
								unmounts.push(instance.unmount);
								break;
						}
						Object.defineProperty(this, actualKey, {
							writable: false,
							value: instance,
							configurable: false,
							enumerable: false
						});
					} else if (typeof key === 'string') {
						 if (key.indexOf('__observable__') === 0) {
							const actualKey = key.substr(14);
							Object.defineProperty(bus, actualKey, {
								configurable: true,
								writable: false,
								enumerable: false,
								value: instance[actualKey],
							});
							Object.defineProperty(this, actualKey, {
								configurable: false,
								enumerable: false,
								get: () => {
									return (bus as any)[actualKey];
								},
								set: (value: any) => {
									if ((bus as any)[actualKey] === value) {
										return;
									}
									Object.defineProperty(bus, actualKey, {
										configurable: true,
										writable: false,
										enumerable: false,
										value: value,
									});
									bus.dispatch(actualKey, value);
									bus.dispatch('*', { key: actualKey, value });
								}
							});
						} else if (key.indexOf('__observer__') === 0) {
							const actualKey = key.substr(12);
							const observer = (service.prototype as any)[key];
							const eventType = observer.key || '*';
							unsubscribes.push(bus.listen(eventType, ({ key, value }) => {
								if (instance && instance[actualKey]) {
									const oldState = (bus as any).__state__ || {};
									const newState = {
										...oldState,
										[key]: value,
									};
									instance[actualKey](newState);
									Object.defineProperty(bus, '__state__', {
										configurable: true,
										writable: false,
										enumerable: false,
										value: newState,
									});
								}
							}));
						}
					}
				});
			}, 0)

			const originalMount = this.mount;
			this.mount = function (...args: any[]) {
				mounts.forEach(a => a.bind(this)());
				return originalMount.apply(this, args as any);
			};


			const originalUnmount = this.unmount;
			this.unmount = function (...args: any[]) {
				unsubscribes.forEach(a => a());
				unmounts.forEach(a => a.bind(this)());
				return originalUnmount.apply(this, args as any);
			};

			return original.apply(this, args as any);
		};
		f.prototype = original.prototype;
		container.registerService(name, f, type);
		return f;
	};
}
