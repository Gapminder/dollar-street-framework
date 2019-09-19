require('./common');

import * as mongoose from 'mongoose';

const Locations = mongoose.model('Locations');

exports.up = function(next) {
  Locations.update({ country: 'Turkey' }, { $set: { region: '58f5e172410ed2018368c676' } }).exec(next);
};

exports.down = function(next) {
  next();
};
