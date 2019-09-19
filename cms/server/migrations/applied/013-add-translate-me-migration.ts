require('./common');

import * as _ from 'lodash';

import * as mongoose from 'mongoose';

const InterfaceTranslations = mongoose.model('InterfaceTranslations');

const enTrans = {
  translations: [
    {
      HELP_TRANSLATE_TO: 'Help translate to'
    }
  ]
};

exports.up = function(next) {
  InterfaceTranslations.find()
    .limit(1)
    .lean()
    .exec((err, data) => {
      const translations = data[0].translations;

      const enCollection = _.find(translations, { lang: 'en' });

      const enNewCollection = _.extend({}, enCollection, enTrans.translations[0]);

      const enCollectionIndex = _.findIndex(translations, { lang: 'en' });

      translations.splice(enCollectionIndex, 1);

      translations.unshift(enNewCollection);

      InterfaceTranslations.update({ __v: 0 }, { $set: { translations } }).exec(next);
    });
};

exports.down = function(next) {
  next();
};
