import {ReactNode} from 'react';
import {RequestContext} from "./requestContext";
export class AppProvider {
  context: RequestContext = null;
  name: string = 'app';
  splash: ReactNode = null;
  failure: (error: any) => ReactNode = null;
  application: ReactNode = null;
  beginOfHead: ReactNode = null;
  endOfHead: ReactNode = null;
  beginOfBody: ReactNode = null;
  endOfBody: ReactNode = null;
  constructor(context: RequestContext) {
    this.context = context;
  }
  async providerWillStart(context: RequestContext) {};
  async providerWillLoad(context: RequestContext) {
  }
  async providerDidLoad(context: RequestContext) {
  }
}
