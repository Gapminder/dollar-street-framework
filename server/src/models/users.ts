// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 @typedef {Object} Users
 @property {String} email - email of user
 @property {String} password - password of user
 @property {String} salt - salt of user
 @property {String} firstName - firstName of user
 @property {String} lastName - lastName of user
 @property {String} username - username of user
 @property {String} avatar - avatar of user
 @property {ObjectId} country - country of user
 @property {{name: String, link: String, description: String}} company - company of user
 @property {String} google - link to google of user
 @property {String} facebook - link to facebook of user
 @property {String} twitter - link to twitter of user
 @property {String} linkedIn - link to linkedIn of user
 @property {String} description - description of user
 @property {String} role - role of user
 @property {String} type - type of user
 @property {{lang: String, description: String}[]} translations - translations of user description
 */
const usersSchema = new Schema({
  email: String,
  password: String,
  salt: String,
  username: String,
  avatar: String,
  country: { type: Schema.Types.ObjectId, ref: 'Locations' },
  google: String,
  facebook: String,
  twitter: String,
  linkedIn: String,
  /*eslint-disable*/
  role: { type: String, default: 'ambassador' },
  /*eslint-enable*/
  type: { type: Schema.Types.ObjectId, ref: 'UsersTypes' },
  firstName: String,
  lastName: String,
  description: String,
  priority: Number,
  company: { name: String, link: String, description: String },
  translations: [
    {
      lang: String,
      firstName: String,
      lastName: String,
      description: String,
      company: { name: String, link: String, description: String }
    }
  ]
});

usersSchema.index({ email: 1 }, { unique: true });
usersSchema.index({ username: 1 });
usersSchema.index({ 'translations.lang': 1 });

mongoose.model('Users', usersSchema);
// tslint:disable-next-line:no-default-export
export default mongoose.model('Users');
