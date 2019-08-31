import { BaseService } from "./baseService";
import { ServiceType } from "./serviceType";
import { RequestContext } from "./requestContext";
import { clientRead } from "../components/clientRead";

export const container = {
    counter: 0,
    services: <any>{},
    singletons: <any>{},
    registerService<T extends BaseService>(name: string, Service: { new(context: RequestContext): T }, serviceType: ServiceType) {
        if (Object.hasOwnProperty.call(container.services, '__identifier__')) {
            console.error(new Error(`${Service.name} tried to register an existing model.`));
            return
        }
        const id = name;
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
        if (serviceType === 'singleton') {
            this.singletons[id] = new (Service as any)({
                url: '*',
                services: {},
                observers: {},
            } as RequestContext);
            this.singletons[id].instantiate();
        }
        container.services[id] = Service;
    },
    instantiateRequestServices(context: RequestContext) {
        return Object.keys(this.services).reduce((acc: any, key: any) => {
            const Service = this.services[key];
            const { __identifier__, __serviceType__ } = Service;
            if (__serviceType__ === 'request') {
                acc[__identifier__] = new Service(context);
                acc[__identifier__].instantiate();
            }
            return acc;
        }, {})
    },
    gatherData(context: RequestContext) {
        const services = Object.keys(this.services).reduce((acc: any, service) => {
            const Service = this.services[service];
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
                const deprecated = ['mount', 'unmount', 'instantiate', 'context']
                const all = Object.getOwnPropertyNames(instance).filter(a => !deprecated.includes(a)).reduce((acc: any, a) => {
                    const obj = instance[a];
                    if (typeof obj !== 'function' && typeof obj !== 'undefined') {
                        acc[a] = obj;
                    }
                    return acc;
                }, {});

                acc[__identifier__] = all;
            }
            return acc;
        }, {});
        return services;
    },
    restoreData(context: RequestContext) {
        Object.keys(this.services).forEach(service => {
            const Service = this.services[service];
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
                const data = clientRead(`bridge_${__identifier__}`);
                if (data) {
                    const value: any = JSON.parse(data);
                    Object.keys(value).forEach((key: any) => {
                        instance[key] = value[key];
                    })
                }
            }
        });
    }
};