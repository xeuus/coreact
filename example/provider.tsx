import React from 'react';
import {AppProvider, AutoWired, RequestContext} from '../src';
import {App, Home} from './app';

class Provider extends AppProvider {

  home = AutoWired(Home, this);

  async providerDidLoad(context: RequestContext) {
    this.application = <App name="aryan"/>;
    this.beginOfBody = <noscript>
      Hello {this.home.hello}
    </noscript>;
  }
}


module.exports = Provider;