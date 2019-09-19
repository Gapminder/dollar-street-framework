require('./common');

import * as _ from 'lodash';

import * as mongoose from 'mongoose';

const InterfaceTranslations = mongoose.model('InterfaceTranslations');

const enTransRemove = {
  translations: [
    {
      DONATE: 'Donate',
      SUPPORT_DESCRIPTION:
        'Adding more homes and features, hosting all photos online and developing materials for classrooms is not free. Dollar Street is developed by Gapminder - a not-for-profit educational foundation (read more about Gapminder&nbsp;<a style="color: rgb(176, 69, 20); text-decoration: none;" target="_blank" class="gapminder-link" href="http://www.gapminder.org">here</a>&nbsp;- that depends on grants and donations. </br>Please support Dollar Street and help us make sure it can continue to grow!',
      DONATE_MONEY: 'Donate Money',
      ADD_HOME_SMALL: 'Add a Home (Small)',
      ADD_HOME_SMALL_DESCRIPTION:
        'It includes finding the home, sending a photographer there, editing the material, and publishing it live on Dollar Street.',
      ADD_FIVE_HOMES: 'Add 5 Homes',
      ADD_FIVE_HOMES_DESCRIPTION:
        'A package of 5 homes. It includes everything from finding the homes, sending a photographer, to making them visible on Dollar Street.',
      ADD_TEN_HOMES: 'Add 10 Homes',
      ADD_TEN_HOMES_DESCRIPTION:
        'A package of 10 homes on different income levels within a country not yet fully covered on Dollar Street. It includes everything from finding the homes to making them visible on Dollar Street.',
      ADD_VIDEOS: 'Add Videos',
      ADD_VIDEOS_DESCRIPTION:
        'Do you want to see how people really cook, do laundry, do dishes, brush their teeth or other home activities? With your help, we can build a video feature inside of Dollar Street!',
      ADD_YOUR_CURRENCY: 'Add your Currency',
      ADD_YOUR_CURRENCY_DESCRIPTION:
        'Want to see Dollar Street in your local currency? First, we need to build the feature. Support our work on this feature.',
      CHANGE_TIME_UNIT: 'Change Time unit',
      CHANGE_TIME_UNIT_DESCRIPTION:
        'Want to see the Dollar Street homes income in days/weeks/months or years? Support our work with this feature integration.',
      CUSTOM: 'Custom',
      CUSTOM_DESCRIPTION: 'If you want to donate any other amount to Dollar Street, please add it below. Thanks!',
      DONATE_TIME: 'Donate Time',
      TRANSLATE: 'Translate',
      TRANSLATE_DESCRIPTION: 'Make Dollar Street shows up in your language. Help us with the translations!',
      ADD_YOUR_HOME: 'Add your Home',
      ADD_YOUR_HOME_DESCRIPTION:
        'Dollar Street needs more homes. Open your home for a photographer (or take the photos yourself)!',
      TEACH: 'Teach',
      TEACH_DESCRIPTION:
        'Show Dollar Street to people and help them understand how people really live in the World. Or develop workshops and teaching materials and share it with us!',
      SOME_IDEA: 'Some idea',
      SOME_IDEA_DESCRIPTION:
        'If you have some idea on how to help Dollar Street - feel free to sign up! We are always happy with feedback!',
      SOME_BACKERS: 'Some backers',
      FAQ: 'FAQ',
      SIGN_UP: 'Sign up!',
      FAQ_LINK:
        '* If you didn\'t find an answer, maybe it\'s already&nbsp;<a style="color: rgb(176, 69, 20); text-decoration: none;" target="_blank" class="gapminder-link" href="https://docs.google.com/document/d/13u87BWz450cqvqr4TaiWi84yiNa5MOItr46_g1xRcTY/edit?usp=sharing">here</a>&nbsp;in all Dollar Street Q&A.'
    }
  ]
};

const enTrans = {
  translations: [
    {
      ADD_A_HOME: 'Support Dollar Street',
      ADD_A_HOME_DESC:
        'Your donation will make it possible for us to send out one of our photographers to do one more home for Dollar Street.',
      ADD_TEN_HOMES: 'Add 10 homes',
      ADD_TEN_HOMES_DESC:
        'Your donation will make it possible for us to send out one of our photographers to do 10 homes for Dollar Street.',
      HELP_US: "Where it's most needed",
      HELP_US_DESC: 'Help us develop the features most needed at the moment.',
      ADD_AMOUNT: 'Add Amount',
      VOLUNTEER: 'Volunteer',
      VOLUNTEER_DESC:
        'You think you can contribute in other ways? Please sign up to get started! (If you want to add your home, translate or teach, for example).',
      DONATE: 'Donate',
      SIGN_UP: 'Sign up!',
      THANKS_FOR_DONATE: 'Thank you very much for your donation to</br>Dollar Street!'
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

      const enCollectionIndex = _.findIndex(translations, { lang: 'en' });

      translations.splice(enCollectionIndex, 1);

      translations.unshift(enNewCollection);

      InterfaceTranslations.update({ __v: 0 }, { $set: { translations } }).exec(next);
    });
};

exports.down = function(next) {
  next();
};
