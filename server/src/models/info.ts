// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 @typedef {Object} Info
 @property {String} context - context of info,
 @property {{lang: String, context: String}[]} translations - translations of info
 */
const infoSchema = new Schema({
  context: String,
  translations: [
    {
      lang: String,
      context: String
    }
  ]
});

mongoose.model('Info', infoSchema);
// tslint:disable-next-line:no-default-export
export default mongoose.model('Info');
