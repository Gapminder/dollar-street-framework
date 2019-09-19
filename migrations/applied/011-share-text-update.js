'use strict';

require('./common');

const _ = require('lodash');
const mongoose = require('mongoose');
const InterfaceTranslations = mongoose.model('InterfaceTranslations');

const enTrans = {
  translations: [
    {
      LIVES_ON_DOLLAR_STREET:
        'Imagine the world as a street where everyone lives. The poorest live to the left and the richest, to the right. Everybody else lives somewhere in between. Visit Dollar Street to see beds, stoves, toothbrushes and hundreds of other things in homes from all over the World at dollarstreet.org',
      LIVES_ON_DOLLAR_STREET_TWITTER:
        'Imagine the world as a street where everyone lives. The poorest live to the left and the richest, to the right. Everybody else lives somewhere in between.',
      CREATE_A_COMPARISON: 'Create a Comparison'
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
