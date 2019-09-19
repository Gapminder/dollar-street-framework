// tslint:disable:no-floating-promises

import * as mongoose from 'mongoose';

// tslint:disable-next-line:variable-name
const ContentTranslations = mongoose.model('ContentTranslations');

export const strings = (app) => {
  const isAdmin = app.get('validate').isAdmin;
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  app.get(`/${CMS_SERVER_VERSION}/strings`, isAdmin, getAllStrings);
  app.put(`/${CMS_SERVER_VERSION}/strings/update`, isAdmin, updateString);
  app.post(`/${CMS_SERVER_VERSION}/strings/new`, isAdmin, createString);
  app.post(`/${CMS_SERVER_VERSION}/strings/remove`, isAdmin, removeString);
};

function getAllStrings(req, res) {
  ContentTranslations.find({})
    .lean()
    .exec((err, data) => {
      res.json({ success: !err, msg: [], data, error: err });
    });
}

function updateString(req, res) {
  const query = req.body;

  ContentTranslations.update(
    { _id: query._id },
    { $set: { value: query.value, name: query.name, key: query.key, label: query.label } }
  ).exec((err, data) => {
    res.json({ success: !err, msg: [], data, error: err });
  });
}

function createString(req, res) {
  const query = req.body;

  const newContentTranslation = new ContentTranslations({
    name: query.name,
    label: query.label,
    key: query.key
  });

  newContentTranslation.save((err, data) => {
    res.json({ success: !err, msg: [], data, error: err });
  });
}

function removeString(req, res) {
  const id = req.body._id;

  ContentTranslations.remove({ _id: id }).exec((err, data) => {
    res.json({ success: !err, msg: [], data, error: err });
  });
}
