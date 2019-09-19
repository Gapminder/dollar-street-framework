// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc

import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 @typedef {Object} InterfaceTranslations
 @property {{lang: String, interface: {}}[]} translations - translations fields
 */
const contentTranslationsSchema = new Schema({
  label: String,
  name: String,
  key: String,
  value: String,
  translations: [
    {
      lang: String,
      value: String
    }
  ]
});

contentTranslationsSchema.index({ 'translations.lang': 1 });

mongoose.model('ContentTranslations', contentTranslationsSchema);
// tslint:disable-next-line:no-default-export
export default mongoose.model('ContentTranslations');
