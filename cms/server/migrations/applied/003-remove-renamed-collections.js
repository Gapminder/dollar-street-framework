'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
require('./common');
var async = require('async');
var mongoose = require('mongoose');
var db = mongoose.connection.db;
exports.up = function(next) {
  async.parallel(
    [renameCollection('aboutdatas', 'commonshortinfoincomes'), renameCollection('placestypes', 'typesplaces')],
    next
  );
};
exports.down = function(next) {
  next();
};
function renameCollection(from, to) {
  return function(cb) {
    db.dropCollection(to, function(err) {
      if (err) {
        console.error('Drop ' + to + ' collection: ', err);
        return cb(err);
      }
      db.renameCollection(from, to, function(error) {
        if (err) {
          console.error('Rename collection ' + from + ' to ' + to + ': ', error);
          return cb(error);
        }
        cb(null);
      });
    });
  };
}
