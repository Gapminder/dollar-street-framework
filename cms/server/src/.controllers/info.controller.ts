// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
// tslint:disable:no-floating-promises

import * as mongoose from 'mongoose';

// tslint:disable-next-line:variable-name
const Info = mongoose.model('Info');

export const info = (app) => {
  const isAdmin = app.get('validate').isAdmin;
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  app.get(`/${CMS_SERVER_VERSION}/info`, isAdmin, getInfo);
  app.post(`/${CMS_SERVER_VERSION}/info`, isAdmin, updateInfo);
};

function getInfo(req, res) {
  Info.find({})
    .lean()
    .limit(1)
    .exec((err, _info) => {
      /** @type {{success: boolean, msg: Array, data: Info, error: {Error}}} */
      const response = { success: !err, msg: [], data: _info[0], error: err };
      res.json(response);
    });
}

function updateInfo(req, res) {
  const _info = req.body;

  Info.update({ _id: _info._id }, { $set: { context: _info.context } }).exec((err, num) => {
    res.json({ success: !err, msg: [], data: num, error: err });
  });
}
