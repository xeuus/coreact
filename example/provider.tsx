import React from 'react';
import {AppProvider, AutoWired, RequestContext} from '../src';
import {App, Home} from './app';

module.exports = class extends AppProvider {

  home = AutoWired(Home, this);
  constructor(context: RequestContext) {
    super(context);
    this.application = <App name="aryan"/>;
    this.failure = (e: any) => {
      return <div className="container py-2" dir="ltr">
        <label>Uncaught Exception [CLIENT]:</label>
        <pre className="scrollable-horizontal">
          {JSON.stringify(e, (key, value) => {
            if(typeof value == 'object') {
              const obj = {};
              Object.getOwnPropertyNames(value).forEach(name => {
                Object.defineProperty(obj, name, {
                  enumerable: true,
                  value: value[name],
                })
              });
              return obj;
            }
            return value;
          }, '  ')}
        </pre>
      </div>
    };
    this.beginOfBody = <noscript>
      Hello {this.home.hello}
    </noscript>;
  }
};
