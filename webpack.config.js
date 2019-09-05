const path = require('path');
const Webpack = require('./dist/webpack').default;
const instance = new Webpack({
	mode: process.env.NODE_ENV,
	entries: {
		example: [
			'./example/client.ts',
			'./example/app.scss'
		]
	},
	enableGzip: true,
	path: path.resolve(__dirname, './example-bundle'),
	publicPath: '/dist/',
});
module.exports = instance.config();
