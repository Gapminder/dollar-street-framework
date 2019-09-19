'use strict';

require('./common');

const _ = require('lodash');

const mongoose = require('mongoose');
const InterfaceTranslations = mongoose.model('InterfaceTranslations');

const enTransRemove = {translations: []};

const enTrans = {
  translations: [{
    ADD_AMOUNT: 'Add Amount',
    HOW_CAN_HELP: 'How can I help?',
    CURRENCY: 'Currency',
    TIME_UNIT: 'Time unit'
  }]
};

exports.up = function (next) {
  InterfaceTranslations.find().limit(1).lean().exec((err, data) => {
    const translations = data[0].translations;

    const enCollection = _.find(translations, {lang: 'en'});

    const keys = [];

    for (const k in enTransRemove.translations[0]) {
      keys.push(k);
    }

    const filteredCollection = {};

    _.forEach(enCollection, (value, key) => {
      if (keys.indexOf(key) === -1) {
        filteredCollection[key] = value;
      }
    });

    const enNewCollection = _.extend({}, filteredCollection, enTrans.translations[0]);

    const enCollectionIndex = _.findIndex(translations, {lang: 'en'});

    translations.splice(enCollectionIndex, 1);

    translations.unshift(enNewCollection);

    InterfaceTranslations.update({__v: 0}, {$set: {translations}}).exec(next);
  });
};

exports.down = function (next) {
  next();
};
