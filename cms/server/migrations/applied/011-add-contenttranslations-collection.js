'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
require('./common');
var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var ContentTranslations = mongoose.model('ContentTranslations');
var enContentTrans = [
  {
    label: 'Donate',
    name: 'Donate Description',
    key: 'DONATE_DESCRIPTION',
    value:
      '<p>Adding more homes and features, hosting all photos online and developing materials for classrooms is not free. Dollar Street is developed by Gapminder - a not-for-profit educational foundation (read more about Gapminder &lt;a class="gapminder-link" href="http://www.gapminder.org" target="_blank"&gt;here&lt;/a&gt;) - that depends on grants and donations.</p>'
  }
];
exports.up = function(next) {
  var insertContentParallel = {};
  _.forEach(enContentTrans, function(item, index) {
    insertContentParallel['part' + index] = insertContent(item);
  });
  async.parallelLimit(insertContentParallel, 5, function(error) {
    if (error) {
      console.error('parallelLimit error', error);
      return next(error);
    }
    console.log('Done');
    next();
  });
};
function insertContent(item) {
  return function(cb) {
    ContentTranslations.collection.insert(item, cb);
  };
}
exports.down = function(next) {
  next();
};
