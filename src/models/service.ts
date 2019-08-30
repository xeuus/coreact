import {BaseService} from './baseService';

export const globalModels: (typeof BaseService)[] = [];
let index = 0;

export function Service(model: typeof BaseService) {
  Object.defineProperty(model, 'identifier', {
    value: index++,
  });
  if (globalModels.indexOf(model) > -1) {
    console.error(new Error(`${model.name} tried to register an existing model.`));
    return
  }
  globalModels.push(model);
}
