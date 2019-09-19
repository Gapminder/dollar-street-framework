require('./common');

import * as _ from 'lodash';
import * as async from 'async';
import * as mongoose from 'mongoose';

const Users = mongoose.model('Users');

exports.up = function(next) {
  Users.collection.update({}, { $set: { priority: 0 } }, { multi: true }, next);
};

exports.down = function(next) {
  next();
};
