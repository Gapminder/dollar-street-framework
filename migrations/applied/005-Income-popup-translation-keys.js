'use strict';

require('../common');

const _ = require('lodash');
const mongoose = require('mongoose');
const InterfaceTranslations = mongoose.model('InterfaceTranslations');

const enTrans = {
  translations: [{
    INCOME_POPUP_INCOME: 'Income',
    INCOME_POPUP_CURRENCY: 'Currency',
    INCOME_POPUP_TIME_UNIT: 'Time unit',
    INCOME_POPUP_BTN_OK: 'Ok',
    CLOSE: 'Close',
    WEEK: 'Week',
    DAY: 'Day',
    YEAR: 'Year',
    DAILY_INCOME: 'Daily income',
    WEEKLY_INCOME: 'Weekly income',
    YEARLY_INCOME: 'Yearly income',
    CREATE_COMPARISON: 'Create Comparison'
  }]
};

exports.up = function (next) {
  InterfaceTranslations.find({__v: 0}).lean().exec((err, data) => {
    const translations = data[0].translations;

    const enCollection = _.find(translations, {lang: 'en'});

    const enNewCollection = _.extend({}, enCollection, enTrans.translations[0]);

    const enCollectionIndex = _.findIndex(translations, {lang: 'en'});

    translations.splice(enCollectionIndex, 1, enNewCollection);

    InterfaceTranslations.update({__v: 0}, {$set: {translations}}).exec(next);
  });
};

exports.down = function (next) {
  InterfaceTranslations.find({__v: 0}).lean().exec((err, data) => {
    const translations = data[0].translations;

    const enCollection = _.find(translations, {lang: 'en'});

    const enNewCollection = _.omit(enCollection, _.keys(enTrans.translations[0]));

    const enCollectionIndex = _.findIndex(translations, {lang: 'en'});

    translations.splice(enCollectionIndex, 1, enNewCollection);

    InterfaceTranslations.update({__v: 0}, {$set: {translations}}).exec(next);

    next();
  });
};
