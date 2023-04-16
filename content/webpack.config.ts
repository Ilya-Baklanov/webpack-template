import path from 'path';
import webpack from 'webpack';
import Config from 'webpack-config';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import ModuleFederationPlugin from 'webpack/lib/container/ModuleFederationPlugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import dotenv from 'dotenv-flow';

import packages from '../package.json';
import pathApp from './pathApp';

const dotenvResult = dotenv.config();
const { dependencies, name } = packages;
const isDev = process.env.NODE_ENV === 'development';
{% if values.isModuleFederation %}
const moduleFederationPlugin = [
  new ModuleFederationPlugin({
    name: name,
    shared: {
      react: { singleton: true, eager: true, requiredVersion: dependencies.react },
      'react-dom': { singleton: true, eager: true, requiredVersion: dependencies['react-dom'] },
      'react-redux': { singleton: true, eager: true, requiredVersion: dependencies['react-redux'] },
      'react-router-dom': { singleton: true, eager: true, requiredVersion: dependencies['react-router-dom'] },
      'styled-components': { singleton: true, eager: true, requiredVersion: dependencies['styled-components'] },
    },
  }),
];
{% endif %}
const resolvePath = (filePath) => path.resolve(process.cwd(), filePath);

const CommonConfig = new Config().merge({
  entry: [resolvePath('src/polyfills.ts'), resolvePath('src')],
  output: {
    uniqueName: name,
    path: resolvePath('dist'),
    filename: 'static/js/[name].bundle.js',
    assetModuleFilename: 'static/media/[name].[hash][ext]',
    chunkFilename: 'static/js/[name].chunk.js',
    publicPath: 'auto',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js', '.tsx', '.json'],
    alias: pathApp.alias,
  },

  module: {
    rules: [
      {
        oneOf: [
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            type: 'asset',
            parser: {
              dataUrlCondition: {
                maxSize: parseInt(process.env.IMAGE_INLINE_SIZE_LIMIT || '10000', 10),
              },
            },
          },
          {
            test: /\.svg$/,
            use: [
              {
                loader: '@svgr/webpack',
                options: {
                  prettier: false,
                  svgo: true,
                  svgoConfig: {
                    plugins: [{ removeViewBox: false }],
                  },
                  titleProp: true,
                  ref: true,
                },
              },
              {
                loader: 'file-loader',
                options: {
                  name: 'static/[name].[hash].[ext]',
                },
              },
            ],
            issuer: {
              and: [/\.(ts|tsx|js|jsx|md|mdx)$/],
            },
          },
          {
            test: /\.(ts|js)x?$/,
            loader: 'babel-loader',
            exclude: /node_modules/,
            options: {
              cacheDirectory: true,
              cacheCompression: false,
              compact: !isDev,
            },
          },
          {
            test: /\.(s*)css$/,
            use: [
              'style-loader',
              {
                loader: 'css-loader',
                options: {
                  sourceMap: isDev,
                  modules: {
                    exportLocalsConvention: 'camelCase',
                  },
                },
              },
            ],
            include: /\.module\.(s*)css$/,
          },
          {
            test: /\.(s*)css$/,
            use: [
              'style-loader',
              'css-loader',
            ],
            exclude: /\.module\.(s*)css$/,
          },

          {
            exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
            type: 'asset/resource',
          },
          {
            test: /\.(otf|ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
            use: ['base64-inline-loader']
          },
        ],
      },
    ],
  },
  plugins: [
    {% if values.isModuleFederation -%}
    ...moduleFederationPlugin,
    {% endif -%}
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(dotenvResult.parsed),
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].css',
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new HtmlWebpackPlugin({
      inject: true,
      template: resolvePath('src/index.html'),
      publicPath: '/',
    }),
    new CleanWebpackPlugin({
      path: '/dist',
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: 'src/assets', to: 'assets' }],
    }),
  ],
  performance: false,
});

export default CommonConfig;
