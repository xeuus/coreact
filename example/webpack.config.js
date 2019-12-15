const path = require('path');
const Webpack = require('./dist/src/webpack').Webpack;
const instance = new Webpack({
  mode: process.env.NODE_ENV,
  entries: {
    example: [
      './example/client.ts',
      './example/app.sass'
    ]
  },
  enableGzip: true,
  path: path.resolve(__dirname, './bundle'),
  publicPath: '/dist/',
  cssPlugins: [
    require('postcss-rtl')({
      useCalc: true
    }),
  ],
});
instance.isolate('*');
module.exports = instance.config();
