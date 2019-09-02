import React from 'react';
import { AppProvider } from '../src';
import { App } from './app/app';

export class Provider extends AppProvider {
	prepare() {
		this.application = <App name="aryan"/>;
		this.beginOfBody = <noscript>
			Hello Aryan
		</noscript>;
	}
}

