// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 @typedef {Object} Onboarding
 @property {String} name - name of Onboarding for cms name field
 @property {String} header - title of Onboarding
 @property {String} description - description of Onboarding
 @property {{href: String, text: String}} link - link of onboarding
 @property {{
   lang: String,
   name: String,
   header: String,
   description: String,
   link: {
      href: String,
      text: String
    }
  }[]} translations - translations of onboarding
 */
const onboardingSchema = new Schema({
  name: String,
  header: String,
  description: String,
  link: {
    href: String,
    text: String
  },
  translations: [
    {
      lang: String,
      name: String,
      header: String,
      description: String,
      link: {
        href: String,
        text: String
      }
    }
  ]
});

onboardingSchema.index({ 'translations.lang': 1 });

mongoose.model('Onboarding', onboardingSchema);
// tslint:disable-next-line:no-default-export
export default mongoose.model('Onboarding');
