// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 @typedef {Object} Location
 @property {String} country - country
 @property {String} alias - country alias
 @property {String} region - region id of country
 @property {String} description - description of country
 @property {Number} lng - lng of country
 @property {Number} lat - lat of country
 @property {{lang: String, country: String,
 alias: String, description: String}[]} translations - translations of country
 */
const locationSchema = new Schema(
  {
    region: { type: Schema.Types.ObjectId, ref: 'Regions' },
    code: String,
    lng: Number,
    lat: Number,
    country: String,
    alias: String,
    description: String,
    translations: [
      {
        lang: String,
        country: String,
        alias: String,
        description: String
      }
    ]
  },
  {
    timestamps: true
  }
);

locationSchema.index({ country: 1 });
locationSchema.index({ 'translations.lang': 1 });
locationSchema.index({ 'translations.country': 1 });
locationSchema.index({ country: 1, alias: 1, region: 1, lat: 1, lng: 1 });

mongoose.model('Locations', locationSchema);

// tslint:disable-next-line:no-default-export
export default mongoose.model('Locations');
