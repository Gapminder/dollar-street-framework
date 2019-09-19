'use strict';

require('./common');

const mongoose = require('mongoose');
const Exchange = mongoose.model('Exchange');

const dollar = {
  currency: 'Dollar',
  code: 'USD',
  value: 1,
  symbol: '$',
  updated: new Date()
};

const euro = {
  currency: 'Euro',
  code: 'EUR',
  value: 0,
  symbol: '€',
  updated: new Date()
};

const krona = {
  currency: 'Krona',
  code: 'SEK',
  value: 0,
  symbol: 'kr',
  updated: new Date()
};

exports.up = function (next) {
  Exchange.create([dollar, euro, krona], next);
};

exports.down = function (next) {
  next();
};
