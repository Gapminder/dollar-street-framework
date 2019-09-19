// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 @typedef {Object} Regions
 @property {String} name - name of regions
 @property {{lang: String, name: String}[]} translations - translations of region
 */
const regionsSchema = new Schema({
  name: String,
  translations: [
    {
      lang: String,
      name: String
    }
  ]
});

mongoose.model('Regions', regionsSchema);
// tslint:disable-next-line:no-default-export
export default mongoose.model('Regions');
