import {RequireMiddleware} from "../src/require";
//
import express from 'express';
import {Server} from "../src/server";

const path = require('path');
const app = express();
const server = new Server({
  mode: process.env.NODE_ENV,
  provider: () => require('./provider'),
  assets: process.env.NODE_ENV != 'production' ? [
    '/dist/example.js',
  ] : [
    '/dist/example.js.gz',
    '/dist/example.css',
  ],
  publicDir: ['/assets', path.resolve(__dirname, '../../assets')],
  bundleDir: ['/dist', path.resolve(__dirname, '../../bundle')],
  webpackOptions: require('../../webpack.config.js'),
  rootPath: path.resolve(__dirname, '.'),
});
server.isolate('*');
server.start(app);
app.listen(process.env.PORT, () => console.log(`Listening on port ${process.env.PORT}`));
process.on('uncaughtException', (err) => {
  console.log(err);
});
