// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 @typedef {Object} Place
 @property {ObjectId} author - author of place
 @property {String} list - list of place (black or white)
 @property {Number} rating - rating of place 0-5
 @property {String} date - creation date place
 @property {ObjectId} type - place type
 @property {Boolean} isTrash - place in trash (true or false)
 @property {Boolean} isPublic - show place in the main page
 @property {Number} incomeQuality - income quality rating
 @property {Number} income - income of place
 @property {ObjectId} country - country of place
 @property {String} name - name of place
 @property {String} description - description of place
 @property {String} familyInfo - family info
 @property {String} familyInfoSummary - family info summary
 @property {String} aboutData - info about income
 @property {{lang: String, name: String, description: String, familyInfo: String,
 familyInfoSummary: String, aboutData: String}[]} translations - translations of place
 */
const placesSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'Users' },
    list: String,
    /*eslint-disable*/
    rating: { type: Number, default: 0 },
    date: { type: Date, default: +Date.now },
    incomeQuality: { type: Number, default: 10 },
    /*eslint-enable*/
    type: { type: Schema.Types.ObjectId, ref: 'PlacesType' },
    isTrash: Boolean,
    isPublic: Boolean,
    income: Number,
    country: { type: Schema.Types.ObjectId, ref: 'Locations' },
    name: String,
    description: String,
    familyInfo: String,
    familyInfoSummary: String,
    aboutData: String,
    translations: [
      {
        lang: String,
        name: String,
        description: String,
        familyInfo: String,
        familyInfoSummary: String,
        aboutData: String
      }
    ]
  },
  {
    timestamps: true
  }
);

placesSchema.index({ name: 1 }, { unique: true });
placesSchema.index({ 'translations.lang': 1 });
placesSchema.index({ type: 1, list: 1, isTrash: 1, _id: 1 });

mongoose.model('Places', placesSchema);
// tslint:disable-next-line:no-default-export
export default mongoose.model('Places');
