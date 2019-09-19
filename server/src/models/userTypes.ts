// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 @typedef {Object} UsersTypes
 @property {String} name - name of user type
 @property {Number} position - position on the page
 @property {Boolean} isPublic - show or not this type on the page
 @property {{lang: String, name: String}[]} translations - translations of type of users
 */
const usersSchema = new Schema({
  position: Number,
  isPublic: Boolean,
  name: String,
  translations: [
    {
      lang: String,
      name: String
    }
  ]
});

usersSchema.index({ 'translations.lang': 1 });

mongoose.model('UsersTypes', usersSchema);
// tslint:disable-next-line:no-default-export
export default mongoose.model('UsersTypes');
