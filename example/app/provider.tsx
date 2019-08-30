import React from 'react';
import { AppProvider } from '../../src/appProvider';
import { App } from './app';
export class Provider extends AppProvider {
  prepare() {
    this.registerApplication(<App name="aryan"/>);
  }
}

