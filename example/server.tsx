import express from 'express';
import { serverHandler } from '../src/serverHandler';

const path = require('path');
const app = express();

const webpackOptions = require('../../webpack.config.js');
const isDevelopment = process.env.NODE_ENV === 'development';

serverHandler(app, {
	provider: path.resolve(__dirname, './provider'),
	match: '/*',
	assets: isDevelopment ? [
		'/dist/example.js?324!defer',
	] : [
			'/dist/example.js!defer',
			'/dist/example.css',
		],
	proxy: 'http://192.168.88.52/mag',
	enableGzip: true,
	root: path.resolve(__dirname, '..'),
	publicDir: ['/assets', path.resolve(__dirname, '../../example-assets')],
	bundleDir: ['/dist', path.resolve(__dirname, '../../example-bundle')],
	webpackOptions,
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Listening on port ${port}`));

process.on('uncaughtException', (err) => {
	console.log(err);
});
