import React from 'react';
import {AppProvider, RequestContext} from '../src';
import {App} from './app';

export default class Provider extends AppProvider {
  async providerWillLoad(context: RequestContext) {
    this.application = <App name="aryan"/>;
    this.beginOfBody = <noscript>
      Hello Aryan
    </noscript>;
  }
}

