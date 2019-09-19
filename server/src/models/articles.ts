// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc

import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 @typedef {Object} Article
 @property {ObjectId} thing - article of thing
 @property {String} shortDescription - short description of article
 @property {String} description - description of article
 @property {{lang: String, shortDescription: String, description: String}[]} translations - translations of article
 */
const articleSchema = new Schema({
  thing: { type: Schema.Types.ObjectId, ref: 'Things' },
  shortDescription: String,
  description: String,
  translations: [
    {
      lang: String,
      shortDescription: String,
      description: String
    }
  ]
});

articleSchema.index({ thing: 1 });
articleSchema.index({ 'translations.lang': 1 });

mongoose.model('Articles', articleSchema);
// tslint:disable-next-line:no-default-export
export default mongoose.model('Articles');
