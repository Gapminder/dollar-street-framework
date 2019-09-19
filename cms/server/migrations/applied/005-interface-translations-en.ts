require('./common');

import * as mongoose from 'mongoose';

const InterfaceTranslations = mongoose.model('InterfaceTranslations');

const enTrans = {
  translations: [
    {
      lang: 'en',
      FAMILY: 'family',
      SHARE: 'Share',
      IN: 'in',
      BY_DOLLAR: 'by $',
      CANCEL: 'Cancel',
      OK: 'Ok',
      SHOW_ALL: 'Show all',
      HOME: 'Home',
      ABOUT: 'About',
      BLOG: 'Blog',
      PHOTO: 'Photo',
      FOR: 'for',
      DOWNLOAD: 'Download',
      FULLSIZE: 'Fullsize',
      MONTH: 'month',
      ALL_FAMILIES_IN: 'All families in',
      VISIT_FAMILY: 'Visit family',
      VISITED_FAMILIES: 'Visited Families',
      TOTAL_PHOTOS: 'Total Photos',
      TOTAL_VIDEOS: 'Total Videos',
      SEE_HOW_PEOPLE: 'See how people',
      REALLY: 'really',
      LIVE: 'live',
      QUICK_TOUR: 'Quick tour',
      MAYBE_LATER: 'Maybe later',
      WELCOME_TO: 'Welcome to',
      BACK: 'Back',
      NEXT: 'Next',
      READY_TO_START: 'Ready to start',
      OF: 'of',
      POOREST: 'Poorest',
      RICHEST: 'Richest',
      BY_INCOME: 'by income',
      ON_THE_WORLD_MAP: 'on the World map',
      RELATED: 'Related',
      POPULAR: 'Popular',
      ALL_TOPICS: 'All topics',
      READ_MORE: 'Read more',
      SEARCH_THINGS: 'Search things',
      SELECT_COUNTRIES: 'Select countries',
      SEARCH_COUNTRY: 'Search country',
      SHOW_ALL_COUNTRIES: 'Show all countries',
      SELECT_INCOME_RANGE: 'Select income range',
      QUICK_GUIDE: 'Quick guide',
      MAP: 'Map',
      SEND_FEEDBACK: 'Send feedback',
      MORE_FROM: 'More from',
      ALL: 'All',
      VISIT_THIS_HOME: 'Visit this home',
      FAMILY_IN: 'Family in',
      FAMILIES_IN: 'families in',
      TEAM: 'Team',
      TEAM_LOW: 'team',
      PHOTOGRAPHERS: 'Photographers',
      ALL_IMAGES_UNDER: 'All images under',
      LICENSE: 'Licence',
      DEVELOPED_BY: 'Developed by',
      HOME_OF: 'Home of',
      MONTHLY_INCOME: 'Monthly income',
      COUNTRY: 'Country',
      ABOUT_DATA: 'About the data',
      RELATED_SEARCHES: 'Related searches',
      THE_WORLD: 'the World',
      SORT_BY_COUNTRY: 'Sort by country',
      ORGANIZATION: 'Organization',
      SHOW_DETAILS: 'Show details',
      HIDE_DETAILS: 'Hide details',
      FOLLOW: 'Follow',
      SEE_ALL: 'See all',
      FAMILIES: 'Families',
      SEARCH: 'Search',
      READ_LESS: 'Read less',
      PHOTOGRAPHER: 'Photographer',
      SORRY_WE_HAVE_NO: 'Sorry, we have no',
      ON_THIS_INCOME_YET: 'on this income yet'
    }
  ]
};

exports.up = function(next) {
  const interfaceTranslations = new InterfaceTranslations(enTrans);

  interfaceTranslations.save(next);
};

exports.down = function(next) {
  next();
};
