const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  devtool: 'none',
  target: 'web',
  entry: {
    example: isDevelopment ? [
      'react-hot-loader/patch',
      'webpack-hot-middleware/client?path=/__webpackhmr&timeout=20000&reload=true',
      './example/client.ts',
      './example/app.scss'
    ] : [
      './example/client.ts',
      './example/app.scss'
    ],
  },
  output: {
    filename: '[name].js',
    chunkFilename: '[name].bundle.js',
    path: path.resolve(__dirname, './example-bundle'),
    publicPath: '/dist',
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
  plugins: isDevelopment ? [
    new webpack.HotModuleReplacementPlugin(),
  ] : [
    new TerserPlugin({
      parallel: true,
      terserOptions: {
        ecma: 6,
      },
    }),
    new CompressionPlugin({
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
