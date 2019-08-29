import express from 'express';
const path = require('path');
const app = express();
import { serverHandler } from '../src/serverHandler';
import { Provider } from './app/provider';

const webpackOptions = require('../webpack.config.js');
const isDevelopment = process.env.NODE_ENV === 'development';


serverHandler(app, {
  provider: Provider,
  matches: ['/*'],
  assets: isDevelopment ? [
    '/example.js?324!defer',
  ] : [
    '/example.js?343!defer',
    '/example.css',
  ],
  gzip: true,
  path: path.resolve(__dirname, '../../example-bundle'),
  webpackOptions,
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));

process.on('uncaughtException', (err) => {
  console.log(err);
});
