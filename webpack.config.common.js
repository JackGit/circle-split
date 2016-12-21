'use strict';
var webpack = require('webpack');
var path = require('path');

module.exports = {
  entry: {
    'circle-split': './index.js'
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].common.js',
    library: 'CircleSplit',
    libraryTarget: 'commonjs2'
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      minimize: true,
      compress: {
        warnings: false
      }
    })
  ]
};
