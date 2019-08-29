import React from 'react';
import { AppProvider } from '../../src/appProvider';
import { App } from './app';
import { SearchModel } from './searchModel';
import { HelloModel } from './helloModel';

export class Provider extends AppProvider {
  prepare() {
    this.registerModel(SearchModel);
    this.registerModel(HelloModel);
    this.registerApplication(<App/>);
  }
}

