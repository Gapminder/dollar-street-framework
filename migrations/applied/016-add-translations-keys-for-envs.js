// process.env.MODE_ENV='ci';
// process.env.NODE_ENV='ds';

/*
- MODE_ENV=ci NODE_ENV=ds migrate
- MODE_ENV=dev NODE_ENV=crazy migrate
- MODE_ENV=dev NODE_ENV=ds migrate
- MODE_ENV=dev NODE_ENV=warehouses migrate

- MODE_ENV=pre-prod NODE_ENV=ds migrate

- MODE_ENV=prod NODE_ENV=lectures migrate
- MODE_ENV=prod NODE_ENV=clinics migrate
- MODE_ENV=prod NODE_ENV=schools migrate

- MODE_ENV=prod NODE_ENV=ds migrate `CAREFULL!!!!`
*/

'use strict';

require('../common');

const _ = require('lodash');

const mongoose = require('mongoose');
const InterfaceTranslations = mongoose.model('InterfaceTranslations');

const enTrans = {
  translations: [
    {
      CLINICS_FAMILY: 'Clinic',
      CLINICS_FAMILIES: 'Clinics',
      CLINICS_VISITED_FAMILIES: 'Visited clinics',
      CLINICS_VISIT_FAMILY: 'Visit clinic',
      CLINICS_FAMILY_IN: 'Clinic in',
      CLINICS_FAMILIES_IN: 'Clinics in',
      CLINICS_ALL_FAMILIES_IN: 'All clinics in',
      CLINICS_ADD_A_HOME_DESC:
        'Your donation will make it possible for us to send out one of our photographers to do one more clinic for Dollar Street.',
      CLINICS_HOME_OF: 'Health Clinic/Hospital:',
      CLINICS_VISIT_THIS_HOME: 'Visit this clinic',
      SCHOOLS_FAMILY: 'School',
      SCHOOLS_FAMILIES: 'Schools',
      SCHOOLS_VISITED_FAMILIES: 'Visited schools',
      SCHOOLS_VISIT_FAMILY: 'Visit school',
      SCHOOLS_FAMILY_IN: 'School in',
      SCHOOLS_FAMILIES_IN: 'Schools in',
      SCHOOLS_ALL_FAMILIES_IN: 'All schools in',
      SCHOOLS_ADD_A_HOME_DESC:
        'Your donation will make it possible for us to send out one of our photographers to do one more school for Dollar Street.',
      SCHOOLS_HOME_OF: 'School',
      SCHOOLS_VISIT_THIS_HOME: 'Visit this school',
      WAREHOUSES_FAMILY: 'Warehouse',
      WAREHOUSES_FAMILIES: 'Warehouses',
      WAREHOUSES_VISITED_FAMILIES: 'Visited warehouses',
      WAREHOUSES_VISIT_FAMILY: 'Visit warehouse',
      WAREHOUSES_FAMILY_IN: 'Warehouse in',
      WAREHOUSES_FAMILIES_IN: 'Warehouses in',
      WAREHOUSES_ALL_FAMILIES_IN: 'All warehouses in',
      WAREHOUSES_ADD_A_HOME_DESC:
        'Your donation will make it possible for us to send out one of our photographers to do one more warehouse for Dollar Street.',
      WAREHOUSES_HOME_OF: 'Warehouse',
      WAREHOUSES_VISIT_THIS_HOME: 'Visit this warehouse'
    }
  ]
};

exports.up = function(next) {
  InterfaceTranslations.findOne()
    .lean()
    .exec((err, data) => {
      if (err) {
        console.log(`Migration Error: ${err}`);
        return next(err);
      }

      const translations = data.translations;

      const enCollection = _.find(translations, { lang: 'en' });

      const enNewCollection = _.extend({}, enCollection, enTrans.translations[0]);

      const enCollectionIndex = _.findIndex(translations, { lang: 'en' });

      translations.splice(enCollectionIndex, 1, enNewCollection);

      InterfaceTranslations.updateOne({}, { $set: { translations } }).exec(next);
    });
};

exports.down = function(next) {
  InterfaceTranslations.findOne()
    .lean()
    .exec((err, data) => {
      if (err) {
        console.log(`Migration Error: ${err}`);
        return next(err);
      }

      const translations = data.translations;

      const enCollection = _.find(translations, { lang: 'en' });

      const enNewCollection = _.omit(enCollection, _.keys(enTrans.translations[0]));

      const enCollectionIndex = _.findIndex(translations, { lang: 'en' });

      translations.splice(enCollectionIndex, 1, enNewCollection);

      InterfaceTranslations.updateOne({}, { $set: { translations } }).exec(next);
    });
};
