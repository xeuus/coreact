import { BaseService } from './baseService';
import { container } from './container';
import { ServiceType } from './serviceType';
import { RequestContext } from './requestContext';
import { Bus } from '../observer/bus';

export function Service<T extends typeof BaseService>(type: ServiceType = 'request') {
  return (service: T) => {
    const original = service;

    var f: any = function (...args: any[]) {
      const context = args[0] as RequestContext;
      const id = this.__identifier__;
      const instance = new (service as any)(context);
      console.log(context);
      context.observers[id] = context.observers[id] || new Bus();
      const bus = context.observers[id] as Bus;
      const unsubscribes = <Function[]>[];      
      Object.getOwnPropertyNames(service.prototype).forEach((key: string) => {
        if (typeof key === 'string') {
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
                if((bus as any)[actualKey] === value){
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
            })
          } else if (key.indexOf('__observer__') === 0) {
            const actualKey = key.substr(12);
            unsubscribes.push(bus.listen('*', ({ key, value }) => {
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

      const originalMount = this.mount;
      this.mount = function (...args: any[]) {
        return originalMount.apply(this, args as any);
      }


      const originalUnmount = this.unmount;
      this.unmount = function (...args: any[]) {
        unsubscribes.forEach(a => a());
        return originalUnmount.apply(this, args as any);
      }

      return original.apply(this, args as any)
    }
    f.prototype = original.prototype;
    container.registerService(f, type);
    return f
  }
}