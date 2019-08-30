import { BaseService } from "./baseService";
import { ServiceType } from "./serviceType";

export const container = {
    counter: 0,
    services: <any>{},
    singletons: <any>{},
    registerService<T extends BaseService>(Service: { new(): T }, serviceType: ServiceType) {
        if (Object.hasOwnProperty.call(container.services, '__identifier__')) {
            console.error(new Error(`${Service.name} tried to register an existing model.`));
            return
        }
        const id = this.counter++;
        Object.defineProperty(Service, '__identifier__', {
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
        if(serviceType === 'singleton'){
            this.singletons[id] = new Service();
        }
        container.services[id] = Service;
    },
    instantiateRequestServices() {
        return Object.keys(this.services).reduce((acc: any, key: any) => {
            const Service = this.services[key];
            const {__identifier__,__serviceType__} = Service;
            if(__serviceType__ === 'request'){
                acc[__identifier__] = new Service();
            }
            return acc;
        }, {})
    }
};