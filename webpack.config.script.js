'use strict';
var webpack = require('webpack');
var path = require('path');

module.exports = {
  entry: {
    'circle-split': './index.js'
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].min.js',
    library: 'CircleSplit',
    libraryTarget: 'var'
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
