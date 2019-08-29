import { ReactNode } from 'react';
import { AppContext } from './context';
import { Model } from './models/model';

export class AppProvider {
  name: string = 'app';
  splash: ReactNode = null;
  models: (typeof Model)[] = [];
  application: ReactNode = null;
  private context: AppContext = {};

  constructor(context: AppContext) {
    this.context = context;
    this.application = null;
    this.splash = null;
    this.models = [];
  }
  public prepare() {
  }
  public registerApplication(app: ReactNode){
    this.application = app;
  }
  public registerModel(model: typeof Model) {
    if (this.models.indexOf(model) > -1) {
      console.error(new Error(`${model.name} tried to register an existing model.`));
      return
    }
    this.models.push(model);
  }
}
