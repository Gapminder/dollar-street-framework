// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc

import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 @typedef {Object} CommonInfoPlaces
 @property {String} description - common info of places,
 @property {{lang: String, description: String}[]} translations - translations of common info of places
 */
const commonShortInfoIncomeSchema = new Schema({
  description: String,
  translations: [
    {
      lang: String,
      description: String
    }
  ]
});

commonShortInfoIncomeSchema.index({ 'translations.lang': 1 });

mongoose.model('CommonShortInfoIncome', commonShortInfoIncomeSchema);
// tslint:disable-next-line:no-default-export
export default mongoose.model('CommonShortInfoIncome');
