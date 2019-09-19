'use strict';

require('./common');

const _ = require('lodash');
const mongoose = require('mongoose');
const InterfaceTranslations = mongoose.model('InterfaceTranslations');

const enTrans = {
  translations: [
    {
      LIVES_ON_DOLLAR_STREET_TWITTER:
        'Imagine the world as a street. Everyone lives on Dollar Street. The poorest to the left and the richest on the right. Every else live somewhere in between. Where would you live? - Dollar Street',
      LIVES_ON_DOLLAR_STREET:
        'Imagine the world as a street. Everyone lives on Dollar Street. The poorest to the left and the richest on the right. Every else live somewhere in between. Where would you live? Visit Dollar Street and see homes from hundreds of homes from all over the World.'
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
