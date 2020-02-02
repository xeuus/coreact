import React, {Fragment} from 'react';
import {AppProvider, Client, RequestContext} from "../src";
import {App} from "./app";
import {RegisterDebugger} from "../src/debugger";
import {TodoService} from "./todos/TodoService";

module.exports = class Provider extends AppProvider {
  constructor(context: RequestContext) {
    super(context);
    RegisterDebugger(context);
    this.application = <App/>;
    this.beginOfHead = <Fragment>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no, user-scalable=no"/>
    </Fragment>;
    this.failure = err => <div>somthing went wrong</div>;
    this.splash = <div>loading</div>;
    this.context.locale = 'fa';

    (window as any).__CLIENT = Client;
    (window as any).__COREACT = context;
    (window as any).__SERVICE = context.services.reduce((acc, service) => {
      acc[service.constructor.name] = service;
      return acc;
    }, {} as any);
  }
};

