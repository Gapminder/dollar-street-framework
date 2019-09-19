'use strict';

const _ = require('lodash');
const path = require('path');
const webpackConfig = require('../webpack.config.js');

_.merge(webpackConfig, {
  progress: false,
  stats: false,
  debug: false,
  quiet: true
});

webpackConfig.plugins = _.filter(webpackConfig.plugins, plugin => !plugin.chunkNames);

const files = [path.resolve(webpackConfig.context, webpackConfig.entry.dollarstreet + '/**/*.spec.js')];

const preprocessors = _.reduce(files, function (result, file) {
  result[file] = ['webpack', 'coverage'];
  return result;
}, {});

const preFiles = [path.resolve(webpackConfig.context, '../node_modules/angular/angular.js'),
  path.resolve(webpackConfig.context, '../node_modules/angular-mocks/angular-mocks.js')];

Array.prototype.unshift.apply(files, preFiles);

module.exports = config => {
  config.set({
    frameworks: ['mocha', 'chai', 'sinon', 'chai-sinon'],
    files: files,
    reporters: ['progress', 'coverage'],
    preprocessors: preprocessors,
    coverageReporter: {
      type: 'html',
      dir: '../ds.public/coverage/'
    },
    autoWatch: false,
    colors: true,
    browsers: ['PhantomJS'],
    webpack: webpackConfig,
    webpackServer: {
      progress: false,
      stats: false,
      debug: false,
      quiet: true
    },
    plugins: [
      require('karma-webpack'),
      require('karma-mocha'),
      require('karma-chai'),
      require('karma-sinon'),
      require('karma-chai-sinon'),
      require('karma-phantomjs-launcher'),
      require('karma-coverage')
    ],
    singleRun: true
  });
};
