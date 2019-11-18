export type WebpackConfigOptions = {
  entries: { [key: string]: string[] },
  path: string;

  mode?: 'production' | 'development',
  enableGzip?: boolean;
  publicPath?: string;
  externals?: any;
  sassOptions?: any;
}

module.exports = class Webpack {
  options: WebpackConfigOptions = {
    mode: 'production',
    entries: {},
    enableGzip: true,
    path: '',
    publicPath: '/dist/',
    sassOptions: {},
    externals: {},
  };

  constructor(options: WebpackConfigOptions) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  isolate(name: string){
    if(name) {
      if(name == '*'){
        this.options.path += '/default';
        return
      }
      const path = '/'+name;
      this.options.path += path;
      this.options.publicPath  = path + this.options.publicPath
    }
  }

  config = () => {
    const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
    const webpack = require('webpack');
    const MiniCssExtractPlugin = require('mini-css-extract-plugin');
    const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
    const TerserPlugin = require('terser-webpack-plugin');

    const {enableGzip, path, publicPath, entries, mode, externals = {}, sassOptions = {}} = this.options;
    const CompressionPlugin = enableGzip && require('compression-webpack-plugin');
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
      externals,
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
              {
                loader: 'postcss-loader',
                options: {
                  plugins: [
                    require('autoprefixer')()
                  ]
                }
              },
              {
                loader: 'sass-loader',
                options: sassOptions,
              }
            ],
          },
        ],
      },
      optimization: isDevelopment ? {} : {
        minimize: true,
        minimizer: [
          new TerserPlugin({
            parallel: 2,
            extractComments: false,
            terserOptions: {
              ecma: 6,
              output: {
                comments: false,
              },
            },
          }),
        ]
      },
      plugins: isDevelopment ? [
        new webpack.HotModuleReplacementPlugin(),
      ] : [
        ...(enableGzip ? [new CompressionPlugin({
          test: /(\.js)$/,
          deleteOriginalAssets: true,
        })] : []),
        new OptimizeCSSAssetsPlugin(),
        new MiniCssExtractPlugin({
          filename: '[name].css',
          chunkFilename: '[key].css',
        }),
      ],
    };
  };
};
