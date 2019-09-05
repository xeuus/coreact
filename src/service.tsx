import React, { createContext, ReactNode } from 'react';
import { clientRead } from './helpers/clientRead';

let counter = 0;
const services: any[] = [];


export type RequestContext = {
	url: string;
	baseUrl: string;
	dateTime: Date;
	services: any[];
	environment: 'none' | 'server' | 'client';
};

export type Listener = (...args: any[]) => any;
export type Unsubscribe = () => any;

export class EventBus {
	listeners: Listener[] = [];
	dispatch = (...args: any[]) => {
		this.listeners.forEach(listener => listener(...args));
	};
	listen = (listener: Listener): Unsubscribe => {
		this.listeners.push(listener);
		return () => {
			this.listeners.splice(this.listeners.indexOf(listener), 1);
		};
	};
}

export const extractDataOnServerSide = (context: RequestContext) => {
	return context.services.reduce((acc, service) => {
		const { id, save = [], fetch = [] } = metadataOf(service);
		acc[id] = acc[id] || {};
		if (save.length > 0) {
			save.forEach((data: any) => {
				const { key } = data;
				acc[id][key] = service[key];
			});
		}
		if (fetch.length > 0) {
			fetch.forEach((data: any) => {
				const { key } = data;
				acc[id][key] = service[key];
			});
		}
		return acc;
	}, {});
};


export const restoreDataOnClientSide = (context: RequestContext) => {
	context.services.forEach((service) => {
		const { id, save = [], fetch = [] } = metadataOf(service);
		const data = clientRead(`bridge${id}`);
		if (data) {
			const json = JSON.parse(data);
			save.forEach((data: any) => {
				const { key } = data;
				if(json[key]) {
					service[key] = json[key];
				}
			});
			fetch.forEach((data: any) => {
				const { key } = data;
				if(json[key]) {
					service[key] = json[key];
					const {fetched = []} = metadataOf(service)
					metadata(service, {
						fetched: [...fetched, {
							key,
						}],
					});
				}
			});
		}
	});
};

export const gatherAsyncProperties = async (context: RequestContext) => {
	const pm = context.services.reduce((acc, service) => {
		const { fetch = [] } = metadataOf(service);
		fetch.forEach((data: any) => {
			const { key, func } = data;
			const { fetched = [] } = metadataOf(service);
			const newFunc = async ()=> {
				const result = await (func.bind(service))(context)
				Object.defineProperty(service, key, {
					writable: false,
					enumerable: true,
					configurable: true,
					value: result,
				});
			}
			if (fetched.indexOf(key) < 0) {
				acc.push(newFunc());
			}
		});
		return acc;
	}, []);
	return await Promise.all(pm);
};

const context = createContext<RequestContext>({
	baseUrl: '',
	dateTime: null,
	environment: 'none',
	url: '/',
	services: [],
});


export function metadataOf(target: any) {
	return target.__metadata__ || {};
}

export function metadata(target: any, value: any) {
	Object.defineProperty(target, '__metadata__', {
		configurable: true,
		enumerable: false,
		writable: false,
		value: {
			...metadataOf(target),
			...value,
		}
	});
}

export function service(target: any) {
	const original = target;
	const func = function () {
		original.apply(this, arguments);
		const { id, observer } = metadataOf(this);
		const { observables = [], observers = [] } = metadataOf(target.prototype);

		const component = this;
		observers.forEach((data: any) => {
			const { key, observer } = data;
			observer.listen(function () {
				component[key].apply(this, arguments);
			});
		});

		observables.forEach((data: any) => {
			const { key } = data;
			Object.defineProperty(this, '$' + key, {
				configurable: false,
				writable: true,
				enumerable: false,
				value: this[key],
			});
			Object.defineProperty(this, key, {
				configurable: false,
				enumerable: true,
				get: () => {
					return this['$' + key];
				},
				set: (value: any) => {
					Object.defineProperty(this, '$' + key, {
						configurable: false,
						writable: true,
						enumerable: false,
						value: value,
					});
					observer.dispatch(key, value, id);
				}
			});
		});

		return;
	};
	func.prototype = original.prototype;
	const id = counter++;
	services[id] = func;
	metadata(func.prototype, { id, observer: new EventBus() });
	return func as any;
}


export function consumer(target: any) {
	const original = target;
	const func = function () {
		const { observers = [] } = metadataOf(target.prototype);
		const component = this;
		const release: any[] = [];
		const originalDidMount = this.componentDidMount;
		if (originalDidMount) {
			this.componentDidMount = function () {
				observers.forEach((data: any) => {
					const { key, observer } = data;
					release.push(observer.listen(function () {
						component[key].apply(this, arguments);
					}));
				});
				return originalDidMount.apply(this, arguments);
			};
		}

		const originalUnmount = this.componentWillUnmount;
		if (originalUnmount) {
			this.componentWillUnmount = function () {
				release.forEach(func => func());
				return originalUnmount.apply(this, arguments);
			};
		}

		return original.apply(this, arguments);
	};
	func.contextType = context;
	func.prototype = original.prototype;
	return func as any;
}


export function binder<T>(type: { new(): T }): T {
	const meta = metadataOf(type.prototype);
	return this.context ? this.context.services[meta.id] : null;
}


export function save(target: any, key: string) {
	const { save = [] } = metadataOf(target);
	metadata(target, {
		save: [...save, {
			key,
		}]
	});
}

export function fetch(func: (context: RequestContext) => Promise<any>) {
	return (target: any, key: string) => {
		const { fetch = [] } = metadataOf(target);
		metadata(target, {
			fetch: [...fetch, {
				key,
				func,
			}]
		});
	};
}

export function inject<T>(target: any, key: string) {
	const { services = [] } = metadataOf(target);
	metadata(target, {
		services: [...services, {
			key,
		}]
	});
}


export function observable(target: any, key: string) {
	const { observables = [] } = metadataOf(target);
	metadata(target, {
		observables: [...observables, {
			key,
		}]
	});
}

export function observe<T>(type: { new(): T }) {
	const { observer } = metadataOf(type.prototype);
	return (target: any, key: string) => {
		const { observers = [] } = metadataOf(target);
		metadata(target, {
			observers: [...observers, {
				key, observer,
			}]
		});
	};
}

export function ContextProvider(props: { context: RequestContext; children: ReactNode }) {
	return <context.Provider value={props.context}>
		{props.children}
	</context.Provider>;
}

export function registerServices(context: RequestContext) {
	context.services = services.map((a: any) => new a());
	context.services.forEach((service: any) => {
		Object.defineProperty(service, 'context', {
			value: context,
			configurable: false,
			enumerable: false,
			writable: false,
		});
		service.constructor.apply(service);
	});
}
