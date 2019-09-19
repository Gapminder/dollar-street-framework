'use strict';

require('./common');

const _ = require('lodash');
const mongoose = require('mongoose');
const InterfaceTranslations = mongoose.model('InterfaceTranslations');

const enTrans = {
  translations: [
    {
      INCOME_POPUP__PPP_CURRENCY: 'Currency (in PPP)',
      INCOME_POPUP_TIME_LABEL: 'Time',
      INCOME_POPUP_PER_ADULT: 'Per adult in each home'
    }
  ]
};

exports.up = function(next) {
  InterfaceTranslations.find({ __v: 0 })
    .lean()
    .exec((err, data) => {
      const translations = data[0].translations;

      const enCollection = _.find(translations, { lang: 'en' });

      const enNewCollection = _.extend({}, enCollection, enTrans.translations[0]);

      const enCollectionIndex = _.findIndex(translations, { lang: 'en' });

      translations.splice(enCollectionIndex, 1, enNewCollection);

      InterfaceTranslations.update({ __v: 0 }, { $set: { translations } }).exec(next);
    });
};

exports.down = function(next) {
  InterfaceTranslations.find({ __v: 0 })
    .lean()
    .exec((err, data) => {
      const translations = data[0].translations;

      const enCollection = _.find(translations, { lang: 'en' });

      const enNewCollection = _.omit(enCollection, _.keys(enTrans.translations[0]));

      const enCollectionIndex = _.findIndex(translations, { lang: 'en' });

      translations.splice(enCollectionIndex, 1, enNewCollection);

      InterfaceTranslations.update({ __v: 0 }, { $set: { translations } }).exec(next);

      next();
    });
};
