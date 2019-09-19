// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 @typedef {Object} InfoPlaces
 @property {ObjectId} place - info of place
 @property {ObjectId} question - question of place
 @property {ObjectId} form - question of form
 @property {Mixed} answers - answers of question,
 @property {{lang: String, answers: Mixed}[]} translations - translations of info of place
 */
const infoPlacesSchema = new Schema({
  place: { type: Schema.Types.ObjectId, ref: 'Places' },
  question: { type: Schema.Types.ObjectId, ref: 'Question' },
  form: { type: Schema.Types.ObjectId, ref: 'Forms' },
  answer: Schema.Types.Mixed,
  translations: [
    {
      lang: String,
      answer: Schema.Types.Mixed
    }
  ]
});

infoPlacesSchema.index({ 'translations.lang': 1 });

mongoose.model('InfoPlaces', infoPlacesSchema);
// tslint:disable-next-line:no-default-export
export default mongoose.model('InfoPlaces');
