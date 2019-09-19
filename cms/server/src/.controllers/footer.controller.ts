// tslint:disable:no-floating-promises

import * as mongoose from 'mongoose';

// tslint:disable-next-line:variable-name
const Footer = mongoose.model('Footer');

export const footer = (app) => {
  const isAdmin = app.get('validate').isAdmin;
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  app.get(`/${CMS_SERVER_VERSION}/footer`, isAdmin, getFooterText);
  app.post(`/${CMS_SERVER_VERSION}/footer/edit`, isAdmin, editFooterText);
};

function getFooterText(req, res) {
  Footer.find()
    .lean()
    .limit(1)
    .exec((err, data) => {
      const response = { success: !err, msg: [], data: data[0], error: err };
      res.json(response);
    });
}

function editFooterText(req, res) {
  const _footer = req.body;

  Footer.update({ _id: _footer._id }, { $set: { text: _footer.text } }).exec((err, num) => {
    return res.json({ success: !err, msg: [], data: num, error: err });
  });
}
