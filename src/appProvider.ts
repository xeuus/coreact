import { ReactNode } from 'react';
import { ApplicationContext } from './appContext';

export class AppProvider {
  name: string = 'app';
  splash: ReactNode = null;
  application: ReactNode = null;
  private context: ApplicationContext = {};

  constructor(context: ApplicationContext) {
    this.context = context;
    this.application = null;
    this.splash = null;
  }
  public prepare() {
  }
  public registerApplication(app: ReactNode){
    this.application = app;
  }
}
