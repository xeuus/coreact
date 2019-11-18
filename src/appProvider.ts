import {ReactNode} from 'react';
import {RequestContext} from "./requestContext";

export class AppProvider {
  context: RequestContext = null;
  name: string = 'app';
  storagePrefix?: string = 'app';
  splash: ReactNode = null;
  application: ReactNode = null;
  beginOfHead: ReactNode = null;
  endOfHead: ReactNode = null;
  beginOfBody: ReactNode = null;
  endOfBody: ReactNode = null;

  constructor(context: RequestContext) {
    this.context = context;
  }

  async providerWillLoad(context: RequestContext) {
  }

  async providerDidLoad(context: RequestContext) {
  }
}
