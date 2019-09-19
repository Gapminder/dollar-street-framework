'use strict';

require('./common');

const _ = require('lodash');
const mongoose = require('mongoose');
const ContentTranslations = mongoose.model('ContentTranslations');

const enTrans = {
  value:
    '<p>Adding more homes and features, hosting all photos online and developing materials for ' +
    'classrooms is not free. Dollar Street is developed by Gapminder' +
    '(we are a non-profit, read more &lt;a class="gapminder-link" href="http://www.gapminder.org" ' +
    'target="_blank"&gt;here&lt;/a&gt;). Help us let Dollar Street grow.</p>'
};

exports.up = function(next) {
  ContentTranslations.update({ key: 'DONATE_DESCRIPTION' }, { $set: { value: enTrans.value } }).exec(next);
};
