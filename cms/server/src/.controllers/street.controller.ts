// tslint:disable:no-floating-promises

import * as mongoose from 'mongoose';
import * as _ from 'lodash';

// tslint:disable-next-line:variable-name
const Street = mongoose.model('StreetSettings');

export const street = (app) => {
  const isAdmin = app.get('validate').isAdmin;
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  app.get(`/${CMS_SERVER_VERSION}/street`, isAdmin, getStreetTips);
  app.post(`/${CMS_SERVER_VERSION}/street/edit/:id`, isAdmin, editStreetTips);
  app.post(`/${CMS_SERVER_VERSION}/show-street-attrs/:id`, isAdmin, editShowStreetAttrs);
  app.post(`/${CMS_SERVER_VERSION}/street-multi/edit/:id`, isAdmin, editStreetMultiples);
  app.post(`/${CMS_SERVER_VERSION}/street-labels/edit/:id`, isAdmin, editStreetLabels);
  app.get(`/${CMS_SERVER_VERSION}/street-dividers/add/:id/:dividerValue`, isAdmin, addDivider);
  app.get(`/${CMS_SERVER_VERSION}/street-dividers/remove/:id/:dividerValue`, isAdmin, removeDivider);
};

function getStreetTips(req, res) {
  Street.find({})
    .lean()
    .exec((err, data) => {
      res.json({ success: !err, msg: [], data, error: err });
    });
}

function editStreetTips(req, res) {
  const param = req.params;

  const streetData = req.body;

  if (streetData.poor === 0) {
    streetData.poor = 1;
  }

  Street.update(
    { _id: param.id },
    {
      $set: {
        low: streetData.low,
        medium: streetData.medium,
        high: streetData.high,
        poor: streetData.poor,
        rich: streetData.rich
      }
    }
  ).exec((err, num) => {
    res.json({ success: !err, msg: [], data: num, error: err });
  });
}

function editStreetMultiples(req, res) {
  const param = req.params;
  const streetData = req.body;

  Street.update(
    { _id: param.id },
    {
      $set: {
        lowDividerCoord: streetData.lowDividerCoord,
        mediumDividerCoord: streetData.mediumDividerCoord,
        highDividerCoord: streetData.highDividerCoord
      }
    }
  ).exec((err, num) => {
    res.json({ success: !err, msg: [], data: num, error: err });
  });
}

function editShowStreetAttrs(req, res) {
  const body = req.body;
  const flag = body.showStreetAttrs;

  Street.update(
    { _id: flag._id },
    {
      $set: {
        showDividers: flag.showDividers,
        showLabels: flag.showLabels,
        showCurrency: flag.showCurrency
      }
    }
  ).exec((err, num) => {
    res.json({ success: !err, msg: [], data: num, error: err });
  });
}

function editStreetLabels(req, res) {
  const param = req.params;
  const body = req.body;

  Street.update(
    { _id: param.id },
    {
      $set: {
        firstLabelName: body.firstLabelName,
        secondLabelName: body.secondLabelName,
        thirdLabelName: body.thirdLabelName,
        fourthLabelName: body.fourthLabelName
      }
    }
  ).exec((err, num) => {
    console.log(err, 'ERRR');
    res.json({ success: !err, msg: [], data: num, error: err });
  });
}

function addDivider(req, res) {
  if (!_.isNaN(+req.params.dividerValue)) {
    Street.find({ _id: req.params.id })
      .limit(1)
      .lean()
      .exec((err, data) => {
        const streetSettings = data[0];
        let dividers = streetSettings.dividers;

        dividers.push(Number(req.params.dividerValue));
        dividers = _.sortBy(_.uniq(dividers));

        Street.update(
          { _id: req.params.id },
          {
            $set: { dividers }
          }
        ).exec((updateStreetErr, _data) => {
          if (!updateStreetErr) {
            streetSettings.dividers = dividers;
            res
              .status(201)
              .json({ success: !updateStreetErr, msg: [], data: [streetSettings], error: updateStreetErr });
          } else {
            res.json({ success: !updateStreetErr, msg: [], data: _data, error: updateStreetErr });
          }
        });
      });
  } else {
    res.status(400).json({ success: true, msg: 'dividers is not number' });
  }
}

function removeDivider(req, res) {
  const dividerValue = Number(req.params.dividerValue);
  if (dividerValue) {
    Street.find({ _id: req.params.id })
      .limit(1)
      .lean()
      .exec((err, data) => {
        const streetSettings = data[0];
        let dividers = streetSettings.dividers;

        dividers = _.filter(dividers, (value) => {
          return value !== dividerValue;
        });

        Street.update(
          { _id: req.params.id },
          {
            $set: { dividers }
          }
        ).exec((updateStreetError, _data) => {
          if (!updateStreetError) {
            streetSettings.dividers = dividers;
            res
              .status(201)
              .json({ success: !updateStreetError, msg: [], data: [streetSettings], error: updateStreetError });
          } else {
            res.json({ success: !updateStreetError, msg: [], data: _data, error: updateStreetError });
          }
        });
      });
  } else {
    res.status(400).json({ success: true, msg: 'dividers is not number' });
  }
}
