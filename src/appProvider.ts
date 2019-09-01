import { ReactNode } from 'react';
import { RequestContext } from './dependencyInjection/requestContext';

export class AppProvider {
  name: string = 'app';
  splash: ReactNode = null;
  application: ReactNode = null;

  constructor(context: RequestContext) {
    this.application = null;
    this.splash = null;
  }

  public prepare() {
  }
  
  public registerApplication(app: ReactNode){
    this.application = app;
  }
}
