// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 @typedef {Object} Language
 @property {String} name - name of language
 @property {Boolean} isPublic - show language public
 @property {String} code - code of language
 */
const languagesSchema = new Schema({
  isPublic: { type: Boolean, default: false },
  alias: String,
  code: String,
  name: String,
  position: Number,
  translations: [
    {
      lang: String,
      name: String
    }
  ]
});

languagesSchema.index({ code: 1 });
languagesSchema.index({ 'translations.lang': 1 });

mongoose.model('Languages', languagesSchema);
// tslint:disable-next-line:no-default-export
export default mongoose.model('Languages');
