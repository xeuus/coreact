import { BaseService } from './baseService';
import { ServiceType } from './serviceType';
import { RequestContext } from './requestContext';
import { clientRead } from '../helpers/clientRead';

export const container = {
	counter: 0,
	services: <any>{},
	singletons: <any>{},
	registerService<T extends BaseService>(name: string, Service: { new(context: RequestContext): T }, serviceType: ServiceType) {
		if (Object.hasOwnProperty.call(container.services, '__identifier__')) {
			console.error(new Error(`${Service.name} tried to register an existing model.`));
			return;
		}
		const id = name;
		container.services[id] = Service;
		Object.defineProperty(Service, '__identifier__', {
			value: id,
			configurable: false,
			enumerable: false,
			writable: false,
		});
		Object.defineProperty(Service.prototype, '__identifier__', {
			value: id,
			configurable: false,
			enumerable: false,
			writable: false,
		});
		Object.defineProperty(Service, '__serviceType__', {
			value: serviceType,
			configurable: false,
			enumerable: false,
			writable: false,
		});
		Object.defineProperty(Service.prototype, '__serviceType__', {
			value: serviceType,
			configurable: false,
			enumerable: true,
			writable: false,
		});
	},
	instantiateRequestServices(context: RequestContext) {
		Object.keys(this.services).forEach((key: any) => {
			const Service = this.services[key];
			const { __identifier__, __serviceType__ } = Service;
			if (__serviceType__ === 'request') {
				Object.defineProperty(context.services, __identifier__, {
					value: new Service(context),
					configurable: false,
					enumerable: false,
					writable: true,
				});
			}
		});
	},

	getInstances(context: RequestContext) {
		return Object.keys(this.services).reduce((acc: any, key) => {
			const Service = this.services[key];
			const { __identifier__, __serviceType__ } = Service;
			let instance: any = null;
			switch (__serviceType__) {
				case 'singleton':
					instance = this.singletons[__identifier__];
					break;
				case 'request':
					instance = context.services[__identifier__];
					break;
			}
			if (instance) {
				acc[__identifier__] = instance;
			}
			return acc;
		}, {});
	},
	async fetchData(context: RequestContext) {
		const instances = this.getInstances(context);
		const keys = Object.keys(instances);
		const result = await Promise.all(keys.map(key => {
			const service = instances[key];
			if (!service.__fetched__ && service.preload) {
				return service.preload();
			} else {
				return new Promise((acc) => acc(null));
			}
		}));
		for (let i = 0; i < result.length; i++) {
			if (result[i] !== null) {
				if (instances[keys[i]]) {
					instances[keys[i]]['__fetched__'] = true;
				}
			}
		}
	},
	gatherData(context: RequestContext) {
		const instances = this.getInstances(context);
		return Object.keys(instances).reduce((acc: any, key) => {
			const service = instances[key];
			const deprecated = ['mount', 'unmount', 'instantiate', 'context', 'preload'];
			acc[key] = {
				context: Object.getOwnPropertyNames(service).filter(a => !deprecated.includes(a)).reduce((acc: any, a) => {
					const obj = service[a];
					if (typeof obj !== 'function' && typeof obj !== 'undefined') {
						acc[a] = obj;
					}
					return acc;
				}, {}),
				preFetched: Object.hasOwnProperty.call(service, '__fetched__')
			};
			return acc;
		}, {});
	},
	restoreData(context: RequestContext) {
		const instances = this.getInstances(context);
		return Object.keys(instances).map(key => {
			const service = instances[key];
			const data = clientRead(`bridge_${key}`);
			if (data) {
				const value: any = JSON.parse(data);
				const { context, preFetched } = value;
				Object.keys(context).forEach((key: any) => {
					service[key] = context[key];
				});
				Object.defineProperty(service, '__fetched__', {
					value: preFetched,
					configurable: false,
					enumerable: false,
					writable: false,
				});
			}
			return service;
		});
	}
};
