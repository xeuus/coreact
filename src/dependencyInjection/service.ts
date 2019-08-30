import { BaseService } from './baseService';
import { container } from './container';
import { ServiceType } from './serviceType';

export function Service<T extends BaseService>(type: ServiceType = 'request') {
  
  return (service: { new(): T })=>{
    container.registerService(service, type);
  }
}
