import React from 'react';
import { AppProvider } from '../src';
import { App } from './app';

export default class Provider extends AppProvider {
	async before() {
		this.application = <App name="aryan"/>;
		this.beginOfBody = <noscript>
			Hello Aryan
		</noscript>;
	}
}

