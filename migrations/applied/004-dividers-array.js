'use strict';

require('../common');

const _ = require('lodash');
const mongoose = require('mongoose');

const StreetSettings = mongoose.model('StreetSettings');

exports.up = function (next) {
  StreetSettings.find().limit(1).lean().exec((err, data) => {
    const inputSettings = _.find(data, {__v: 0});
    const withDividers = _.assign({}, inputSettings, {dividers: []});

    StreetSettings.update({__v: 0}, {$set: withDividers}).exec(next);
  });
};

exports.down = function (next) { // change the model for apply this
  StreetSettings.find().limit(1).lean().exec((err, data) => {
    const inputData = _.find(data, {__v: 0});
    const withoutDividers = _.omit(inputData, 'dividers');

    StreetSettings.update({__v: 0}, {$set: withoutDividers}).exec(next);
  });
};
