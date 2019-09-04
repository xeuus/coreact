const path = require('path');
const Module = require('module');

export type WebpackConfigOptions = {
	entries: { [key: string]: string[] },
	mode: 'production' | 'development',
	gzip: boolean;
	path: string;
	publicPath: string;
}

export function register(root: string, baseUrl: string){
	const originalRequire = Module.prototype.require;
	Module.prototype.require = function(p: string){
		if(['jpg', 'gif', 'bmp', 'png', 'svg'].indexOf(p.substr(-3)) > -1){
			const pth = this.filename.toString().substr(root.length).split('/');
			pth.pop();
			return baseUrl + path.resolve(pth.join('/'), p);
		}
		return originalRequire.apply(this, arguments);
	}

	return ()=>{
		Module.prototype.require = originalRequire;
	}
};


export default class Webpack {
	options: WebpackConfigOptions;

	constructor(options: WebpackConfigOptions) {
		this.options = options;
	}
	
	config = () => {
		const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
		const webpack = require('webpack');
		const MiniCssExtractPlugin = require('mini-css-extract-plugin');
		const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
		const TerserPlugin = require('terser-webpack-plugin');

		const { gzip, path, publicPath, entries, mode } = this.options;
		const CompressionPlugin = gzip && require('compression-webpack-plugin');
		const isDevelopment = mode === 'development';

		return {
			mode,
			devtool: 'none',
			target: 'web',
			entry: Object.keys(entries).reduce((acc: any, key) => {
				acc[key] = isDevelopment ? [
					'react-hot-loader/patch',
					'webpack-hot-middleware/client?path=/__webpackhmr&timeout=20000&reload=true',
					...entries[key]
				] : entries[key];
				return acc;
			}, {}),
			output: {
				path,
				publicPath,
				filename: '[name].js',
				chunkFilename: '[name].bundle.js',
				...(isDevelopment ? {
					hotUpdateChunkFilename: 'hot/hot-update.js',
					hotUpdateMainFilename: 'hot/hot-update.json',
				} : {}),
			},
			node: {
				fs: 'empty'
			},
			resolve: {
				extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
				plugins: [new TsconfigPathsPlugin({})],
			},
			externals: {},
			module: {
				rules: [
					{
						test: /\.tsx?$/,
						use: ['ts-loader'],
					},
					{
						test: /\.(svg|png|gif|bmp|jpg|ttf|eot|woff2|woff)$/,
						exclude: /node_modules/,
						use: [
							{
								loader: 'file-loader',
								options: {
									name: '[path][name].[ext]'
								}
							}
						]

					},
					{
						test: /\.(sass|scss|css)$/,
						exclude: /node_modules/,
						use: [
							isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
							'css-loader',
							'postcss-loader',
							'sass-loader'
						],
					},
				],
			},
			optimization: {
				minimizer: [
					new TerserPlugin({
						parallel: 2,
						terserOptions: {
							ecma: 6,
						},
					}),
				]
			},
			plugins: isDevelopment ? [
				new webpack.HotModuleReplacementPlugin(),
			] : [
					gzip && new CompressionPlugin({
						test: /(\.js)$/,
						deleteOriginalAssets: true,
					}),
					new OptimizeCSSAssetsPlugin(),
					new MiniCssExtractPlugin({
						filename: '[name].css',
						chunkFilename: '[key].css',
					}),
				],
		};
	};
};
