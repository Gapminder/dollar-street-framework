// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 @typedef {Object} Footer
 @property {String} text - editable text for footer,
 @property {{lang: String, text: String}[]} translations - translations of footer
 */
const footerSchema = new Schema({
  text: String,
  translations: [
    {
      lang: String,
      text: String
    }
  ]
});

footerSchema.index({ 'translations.lang': 1 });

mongoose.model('Footer', footerSchema);
// tslint:disable-next-line:no-default-export
export default mongoose.model('Footer');
