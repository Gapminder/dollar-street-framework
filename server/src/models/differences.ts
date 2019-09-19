// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc

import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 * @typedef {Object} Differences
 * @property {String} title - title of difference
 * @property {ObjectId} thing - thingId of difference
 * @property {{image: ObjectId, place: ObjectId, fullUrl: String}[]} snippetImages - all images from snippet
 * @property {{image: ObjectId, place: ObjectId, fullUrl: String}[]} comparisonImages - all images from snippet
 * @property {String} image - link image
 * @property {String} imageText - description for difference
 * @property {{_id:ObjectId,country:String}[]} countries - list of countries
 * @property {String} imageLinkText - link text image
 * @property {String} heading - title for difference
 * @property {String} subHeading - subtitle for difference
 * @property {String} isHidden - hide the difference (true or false)
 * @property {{place: ObjectId, country: String}[]} categories - categories of difference
 */
const differencesSchema = new Schema({
  title: String,
  thing: { type: Schema.Types.ObjectId, ref: 'Things' },
  snippetImages: [
    {
      image: { type: Schema.Types.ObjectId, ref: 'Media' },
      place: { type: Schema.Types.ObjectId, ref: 'Places' },
      fullUrl: String
    }
  ],
  comparisonImages: [
    {
      image: { type: Schema.Types.ObjectId, ref: 'Media' },
      place: { type: Schema.Types.ObjectId, ref: 'Places' },
      fullUrl: String
    }
  ],
  image: String,
  imageText: String,
  imageLinkText: String,
  heading: String,
  subHeading: String,
  countries: [{ place: { type: Schema.Types.ObjectId, ref: 'Places' }, country: String }],
  /* eslint-disable */
  isHidden: { type: Boolean, default: true },
  /* eslint-enable */
  categories: [
    {
      place: { type: Schema.Types.ObjectId, ref: 'Places' },
      country: String
    }
  ]
});

mongoose.model('Differences', differencesSchema);
// tslint:disable-next-line:no-default-export
export default mongoose.model('Differences');
