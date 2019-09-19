require('./common');

import * as mongoose from 'mongoose';

const Users = mongoose.model('Users');

exports.up = function(next) {
  Users.collection.update({}, { $unset: { contentfulId: true } }, { multi: true }, next);
};

exports.down = function(next) {
  next();
};
