// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc

import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 @typedef {Object} Category
 @property {String} name - name of category
 @property {String} description - description of category
 @property {String} list - type white or black
 @property {Number} rating - rating of category
 @property {{lang: String, name: String, description: String}[]} translations - translations of category
 */
const categoriesSchema = new Schema({
  list: String,
  /* eslint-disable */
  rating: { type: Number, default: 3 },
  /* eslint-enable */
  name: String,
  description: String,
  translations: [
    {
      lang: String,
      name: String,
      description: String
    }
  ]
});

categoriesSchema.index({ name: 1 }, { unique: true });
categoriesSchema.index({ 'translations.lang': 1 });

mongoose.model('Categories', categoriesSchema);
// tslint:disable-next-line:no-default-export
export default mongoose.model('Categories');
