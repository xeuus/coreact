import React from 'react';
import {AppProvider, AutoWired, RequestContext} from '../src';
import {App, Home} from './app';

module.exports = class extends AppProvider {

  home = AutoWired(Home, this);

  async providerWillLoad(context: RequestContext) {
    this.application = <App name="aryan"/>;
    this.beginOfBody = <noscript>
      Hello {this.home.hello}
    </noscript>;
  }
};
