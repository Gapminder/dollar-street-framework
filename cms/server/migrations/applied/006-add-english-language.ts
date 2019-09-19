require('./common');

import * as mongoose from 'mongoose';

const Languages = mongoose.model('Languages');

const enLanguage = {
  name: 'English',
  alias: 'English',
  code: 'en',
  isPublic: true
};

exports.up = function(next) {
  const Language = new Languages(enLanguage);

  Language.save(next);
};

exports.down = function(next) {
  next();
};
