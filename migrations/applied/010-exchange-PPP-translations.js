'use strict';

require('./common');
const _ = require('lodash');

const mongoose = require('mongoose');
const Exchange = mongoose.model('Exchange');

const translations = [
  {
    code: 'USD',
    translations: [
      {
        lang: 'en',
        CURRENCY_TEXT: 'American Dollar',
        COUNTRY_CODE: 'USA',
        COUNTRY_NAME: 'United States'
      }
    ]
  }
];

exports.up = function(next) {
  _.forEach(translations, (currency) => {
    Exchange.find({ code: currency.code })
      .lean()
      .exec((err, data) => {
        const existCurrency = data[0];

        const updatedCurrency = _.extend({}, existCurrency, currency);

        Exchange.update({ code: currency.code }, { $set: updatedCurrency }).exec(next);
      });
  });
};

exports.down = function(next) {
  _.forEach(translations, (currency) => {
    Exchange.find({ code: currency.code })
      .lean()
      .exec((err, data) => {
        const existCurrency = data[0];

        updatedCurrency.translations = [];

        Exchange.update({ code: currency.code }, { $set: updatedCurrency }).exec(next);
      });
  });
};
