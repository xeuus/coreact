import { Model } from './model';

export const globalModels: (typeof Model)[] = [];
export function Saviour(model: typeof Model) {
  if (globalModels.indexOf(model) > -1) {
    console.error(new Error(`${model.name} tried to register an existing model.`));
    return
  }
  globalModels.push(model);
}
