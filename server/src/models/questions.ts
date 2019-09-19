// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 @typedef {Object} Questions
 @property {String} id - id in the table of question
 @property {{_id: ObjectId, hidden: Boolean, position: Number}[]} forms - ref to the form isHidden,
 positions set and edit in frontend must be here(drag and drop)
 @property {String} type - type of question
 @property {{name: String}[]} list - custom list fields
 @property {String} listSelect - selected list name,
 @property {String} name - name of question
 @property {String} description - description of question
 @property {{lang: String, name: String, description: String}[]} translations - translations of question
 */
const questionsSchema = new Schema(
  {
    id: String,
    forms: [
      {
        _id: { type: Schema.Types.ObjectId, ref: 'Forms' },
        hidden: Boolean,
        position: Number
      }
    ],
    type: String,
    list: [{ name: String }],
    listSelect: String,
    name: String,
    description: String,
    translations: [
      {
        lang: String,
        name: String,
        description: String
      }
    ]
  },
  { id: false }
);

questionsSchema.index({ id: 1 }, { unique: true });
questionsSchema.index({ 'translations.lang': 1 });

mongoose.model('Questions', questionsSchema);
// tslint:disable-next-line:no-default-export
export default mongoose.model('Questions');
