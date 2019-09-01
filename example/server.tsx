import express from 'express';
import { serverHandler } from '../src/serverHandler';
import { Provider } from './provider';

const path = require('path');
const app = express();

const webpackOptions = require('../../webpack.config.js');
const isDevelopment = process.env.NODE_ENV === 'development';


serverHandler(app, {
	provider: Provider,
	matches: ['/*'],
	assets: isDevelopment ? [
		'/example.js?324!defer',
	] : [
		'/example.js!defer',
		'/example.css',
	],
	gzip: true,
	publicDir: ['/assets', path.resolve(__dirname, '../../example-assets')],
	bundleDir: ['/dist', path.resolve(__dirname, '../../example-bundle')],
	webpackOptions,
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Listening on port ${port}`));

process.on('uncaughtException', (err) => {
	console.log(err);
});