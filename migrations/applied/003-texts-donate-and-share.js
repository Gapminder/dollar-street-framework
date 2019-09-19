'use strict';

require('./common');

const _ = require('lodash');

const mongoose = require('mongoose');
const InterfaceTranslations = mongoose.model('InterfaceTranslations');

const enTransRemove = {translations: []};

const enTrans = {
  translations: [{
    HELP_US: 'Support us',
    WELCOME: 'Welcome!',
    WELCOME_DESC: 'Become one of our photographers, translators, teachers or developers.',
    PHOTOS_AS_DATA: 'Dollar Street - photos as data to kill country stereotypes',
    LIVES_ON_DOLLAR_STREET: 'Imagine the world as a street. Everyone lives on Dollar Street. The richest to the left and the poorest to the right. Every else live somewhere in between. Where would you live? Visit Dollar Street and see homes from hundreds of homes from all over the World.'
  }]
};

exports.up = function (next) {
  InterfaceTranslations.find().limit(1).lean().exec((err, data) => {
    const translations = data[0].translations;

    const enCollection = _.find(translations, {lang: 'en'});

    const keys = [];

    for (const k in enTransRemove.translations[0]) {
      console.log(k);
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
