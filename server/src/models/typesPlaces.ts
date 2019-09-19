// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 @typedef {Object} TypesPlaces
 @property {String} name - name of place type
 @property {{lang: String, name: String}[]} translations - translations of type of places
 */
const typesPlacesSchema = new Schema({
  name: String,
  translations: [
    {
      lang: String,
      name: String
    }
  ]
});

typesPlacesSchema.index({ name: 1 }, { unique: true });
typesPlacesSchema.index({ 'translations.lang': 1 });

mongoose.model('TypesPlaces', typesPlacesSchema);
// tslint:disable-next-line:no-default-export
export default mongoose.model('TypesPlaces');
