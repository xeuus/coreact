import React, { createContext, ReactNode } from 'react';
import {clientDecrypt, clientEncrypt, clientRead} from './helpers/clientRead';

let counter = 0;
const services: any[] = [];

export interface ServiceEvents {
	onServerLoad?(context: RequestContext): Promise<any>;
	afterServerLoaded?(context: RequestContext): Promise<any>;
	onClientLoad?(context: RequestContext) : Promise<any>;
	afterClientLoaded?(context: RequestContext): Promise<any>;
}


export type RequestContext = {
	url: string;
	method?: string;
	body?: any;
	query?: any;
	hostname?: string;
	cookies?: any;
	protocol?: string;
	headers?: any;
	useragent?: any;

	baseUrl: string;
	storagePrefix?: string;
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



export let persistChanges = () => {
};

export const registerPersistClient = (context: RequestContext) => {
	persistChanges = ()=>{
		context.services.forEach((service) => {
			const {id, persist = []} = metadataOf(service);
			if (persist.length > 0) {
				const obj: any = {};
				persist.forEach((data: any) => {
					const {key} = data;
					obj[key] = service[key];
				});
				const key = `${context.storagePrefix}_bridge${id}`;
				const data = clientEncrypt(JSON.stringify(obj), key);
				localStorage.setItem(key, data);
			}
		});
	};

	let lock = false;
	function lockedSave() {
		if(!lock){
			lock = true;
			persistChanges();
		}
	}
	try {
		window.addEventListener('beforeunload', lockedSave);
	}catch (e) {
	}
	try {
		window.addEventListener('pagehide', lockedSave);
	}catch (e) {
	}
	try {
		window.addEventListener('visibilitychange', lockedSave);
	}catch (e) {
	}
};
export const restorePersistedDataOnClientSide = (context: RequestContext) => {
	context.services.forEach((service) => {
		const {id, persist = []} = metadataOf(service);
		if (persist.length > 0) {
			if (typeof window.localStorage != undefined) {
				try {
					const key = `${context.storagePrefix}_bridge${id}`;
					const content = clientDecrypt(localStorage.getItem(key), key);
					const json = JSON.parse(content);
					persist.forEach((data: any) => {
						const {key} = data;
						if (json[key]) {
							service[key] = json[key];
						}
					});
				}catch (e) {
					console.error(e);
				}
			}
		}
	});
};

export const restoreDataOnClientSide = (context: RequestContext) => {
	context.services.forEach((service) => {
		const { id, save = [], fetch = [] } = metadataOf(service);
		const data = clientRead(`bridge${id}`);
		if (data) {
			const json = JSON.parse(data);
			save.forEach((data: any) => {
				const { key } = data;
				if (json[key]) {
					service[key] = json[key];
				}
			});
			fetch.forEach((data: any) => {
				const { key } = data;
				if (json[key]) {
					service[key] = json[key];
					const { fetched = [] } = metadataOf(service);
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
			const newFunc = async () => {
				const value = await (func.bind(service))(context);
				if(typeof value !== 'undefined'){
					service[key] = value;
				}
			};
			if (fetched.findIndex((a: any) => a.key === key) < 0) {
				acc.push(newFunc());
			}
		});
		return acc;
	}, []);
	return await Promise.all(pm);
};

export const gatherMethods = async (context: RequestContext, name: string) => {
	const pm = context.services.reduce((acc, service) => {
		if(service[name] ) {
			acc.push(service[name](context));
		}
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
		if(this.context)
			return;

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
				configurable: true,
				writable: true,
				enumerable: false,
				value: this[key],
			});
			Object.defineProperty(this, key, {
				configurable: true,
				enumerable: true,
				get: () => {
					return this['$' + key];
				},
				set: (value: any) => {
					if(this['$' + key] !== value) {
						Object.defineProperty(this, '$' + key, {
							configurable: true,
							writable: true,
							enumerable: false,
							value: value,
						});
						observer.dispatch(key, value, id);
					}
				}
			});
		});

		return original.apply(this, arguments);
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
		this.componentDidMount = function () {
			observers.forEach((data: any) => {
				const { key, observer } = data;
				release.push(observer.listen(function () {
					component[key].apply(this, arguments);
				}));
			});
			if(!originalDidMount) return;
			return originalDidMount.apply(this, arguments);
		};

		const originalUnmount = this.componentWillUnmount;
			this.componentWillUnmount = function () {
				release.forEach(func => func());
				if(!originalUnmount) return;
				return originalUnmount.apply(this, arguments);
			};

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

export function persist(target: any, key: string) {
	const { persist = [] } = metadataOf(target);
	metadata(target, {
		persist: [...persist, {
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
			configurable: true,
			enumerable: false,
			writable: false,
		});
		service.constructor.apply(service);
	});
}
