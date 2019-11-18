const path = require('path');
const Webpack = require('./dist/src/webpack');
const instance = new Webpack({
  mode: process.env.NODE_ENV,
  entries: {
    example: [
      './example/client.ts',
      './example/app.scss'
    ]
  },
  enableGzip: true,
  path: path.resolve(__dirname, './bundle'),
  publicPath: '/dist/',
});
instance.isolate('*');
module.exports = instance.config();
