// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc

import * as mongoose from 'mongoose';

// tslint:disable-next-line:variable-name
const AboutData = mongoose.model('CommonShortInfoIncome');

export const about = (app) => {
  const hasUser = app.get('validate').hasUser;
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  app.get(`/${CMS_SERVER_VERSION}/about-data`, hasUser, getAboutData);

  app.post(`/${CMS_SERVER_VERSION}/about-data`, hasUser, updateAboutData);
};

// tslint:disable:no-floating-promises
function getAboutData(req, res) {
  AboutData.find({})
    .limit(1)
    .lean()
    .exec((err, aboutData) => {
      /** @type {{success: boolean, msg: Array, data: About, error: {Error}}} */
      const response = { success: !err, msg: [], data: aboutData[0], error: err };
      res.json(response);
    });
}
// tslint:enable:no-floating-promises

// tslint:disable:no-floating-promises
function updateAboutData(req, res) {
  const aboutData = req.body;

  AboutData.update({ _id: aboutData._id }, { $set: { description: aboutData.description } }).exec((err, num) => {
    res.json({ success: !err, msg: [], data: num, error: err });
  });
}
// tslint:enable:no-floating-promises
