const path = require('path');
require('../src/webpack').register(path.resolve(__dirname, '..'), '/dist/example');

import express from 'express';
import {serverHandler} from '../src/serverHandler';
import Provider from "./provider";

const app = express();

const webpackOptions = require('../../webpack.config.js');
const isDevelopment = process.env.NODE_ENV === 'development';



serverHandler(app, {
  provider: Provider,
  match: '/*',
  assets: isDevelopment ? [
    '/dist/example.js',
  ] : [
    '/dist/example.js.gz',
    '/dist/example.css',
  ],
  proxy: 'http://localhost:5000/api',
  enableGzip: true,
  publicDir: ['/assets', path.resolve(__dirname, '../../example-assets')],
  bundleDir: ['/dist', path.resolve(__dirname, '../../example-bundle')],
  webpackOptions,
});

const port = process.env.PORT || 4200;
app.listen(port, () => console.log(`Listening on port ${port}`));

process.on('uncaughtException', (err) => {
  console.log(err);
});
