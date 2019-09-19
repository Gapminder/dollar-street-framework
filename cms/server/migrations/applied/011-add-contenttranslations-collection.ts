require('./common');

import * as _ from 'lodash';
import * as async from 'async';

import * as mongoose from 'mongoose';

const ContentTranslations = mongoose.model('ContentTranslations');

const enContentTrans = [
  {
    label: 'Donate',
    name: 'Donate Description',
    key: 'DONATE_DESCRIPTION',
    value:
      '<p>Adding more homes and features, hosting all photos online and developing materials for classrooms is not free. Dollar Street is developed by Gapminder - a not-for-profit educational foundation (read more about Gapminder &lt;a class="gapminder-link" href="http://www.gapminder.org" target="_blank"&gt;here&lt;/a&gt;) - that depends on grants and donations.</p>'
  }
];

exports.up = (next) => {
  const insertContentParallel = {};

  _.forEach(enContentTrans, (item, index) => {
    insertContentParallel[`part${index}`] = insertContent(item);
  });

  async.parallelLimit(insertContentParallel, 5, (error) => {
    if (error) {
      console.error('parallelLimit error', error);

      return next(error);
    }

    console.log('Done');

    next();
  });
};

function insertContent(item) {
  return (cb) => {
    ContentTranslations.collection.insert(item, cb);
  };
}

exports.down = (next) => {
  next();
};
