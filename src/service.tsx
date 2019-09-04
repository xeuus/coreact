
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
	}
	listen = (listener: Listener): Unsubscribe => {
		this.listeners.push(listener);
		return () => {
			this.listeners.splice(this.listeners.indexOf(listener), 1);
		}
	}
}

export const extractData = (context: RequestContext) => {
	return context.services.reduce((acc, service) => {
		const { id, saved = [] } = metadataOf(service);
		if (saved.length > 0) {
			acc[id] = saved.reduce((acc, { key }) => {
				acc[key] = service[key];
				return acc;
			}, {});
		}
		return acc;
	}, {});
}


export const restoreData = (context: RequestContext) => {
	return context.services.forEach((service) => {
		const { id, saved = [] } = metadataOf(service);
		if (saved.length > 0) {
			const data = clientRead(`bridge${id}`);
			if(data){
				const json = JSON.parse(data);
				const keys = Object.keys(json);
				keys.forEach(key=>{
					service[key] = json[key];
				});
				metadata(service, {
					fetched: true,
				})
			}
		}
	});
}
export const fetchAll = async (context: RequestContext) => {
	const services = context.services.filter(service => {
		const {fetched = false} = metadataOf(service);
		return !fetched && service.fetch;
	});
	return await Promise.all(services.map(service => service.fetch(context)))
}


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
		observers.forEach(({ key, observer }) => {
			observer.listen(function () {
				component[key].apply(this, arguments);
			});
		});

		observables.forEach(({ key }) => {
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
					observer.dispatch(key, value, id)
				}
			});
		});

		return
	}
	func.prototype = original.prototype;
	const id = counter++;
	services[id] = func;
	metadata(func.prototype, { id, observer: new EventBus() })
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
			const func = function () {
				observers.forEach(({ key, observer }) => {
					release.push(observer.listen(function () {
						component[key].apply(this, arguments);
					}));
				});
				return originalDidMount.apply(this, arguments);
			}
			this.componentDidMount = func;
		}

		const originalUnmount = this.componentWillUnmount;
		if (originalUnmount) {
			const func = function () {
				release.forEach(func => func());
				return originalUnmount.apply(this, arguments);
			}
			this.componentWillUnmount = func;
		}

		return original.apply(this, arguments);
	}
	func.contextType = context;
	func.prototype = original.prototype;
	return func as any;
}


export function binder<T>(type: { new(): T }): T {
	const meta = metadataOf(type.prototype);
	return this.context ? this.context.services[meta.id] : null;
}



export function save(target: any, key: string) {
	const { saved = [] } = metadataOf(target);
	metadata(target, {
		saved: [...saved, {
			key,
		}]
	});
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
	}
}

export function ContextProvider(props: { context: RequestContext; children: ReactNode }) {
	return <context.Provider value={props.context}>
		{props.children}
	</context.Provider>
}

export function registerServices(context: RequestContext) {
	context.services = services.map((a: any) => new a());
	context.services.forEach((service: any) => {
		Object.defineProperty(service, 'context', {
			value: context,
			configurable: false,
			enumerable: false,
			writable: false,
		})
		service.constructor.apply(service);
	});
}