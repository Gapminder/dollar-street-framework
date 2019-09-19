// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
// tslint:disable:no-floating-promises

import * as mongoose from 'mongoose';

// tslint:disable-next-line:variable-name
const Onboarding = mongoose.model('Onboarding');

export const onboarding = (app) => {
  const isAdmin = app.get('validate').isAdmin;
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  app.get(`/${CMS_SERVER_VERSION}/onboarding`, isAdmin, getOnboardingTips);
  app.post(`/${CMS_SERVER_VERSION}/onboarding/edit/:id`, isAdmin, editOnboardingTips);
};

function getOnboardingTips(req, res) {
  Onboarding.find()
    .lean()
    .exec((err, data) => {
      /** @type {{success: boolean, msg: Array, data: Onboarding[], error: Error} */
      const response = { success: !err, msg: [], data, error: err };
      res.json(response);
    });
}

function editOnboardingTips(req, res) {
  const param = req.params;
  const _onboarding = req.body;

  Onboarding.update(
    { _id: param.id },
    {
      $set: {
        header: _onboarding.header,
        description: _onboarding.description,
        link: _onboarding.link
      }
    }
  ).exec((err, num) => {
    res.json({ success: !err, msg: [], data: num, error: err });
  });
}
