// tslint:disable:no-floating-promises

import * as mongoose from 'mongoose';
import { AdminsBaseQuery } from './admins.interface';

// tslint:disable-next-line:variable-name
const Locations = mongoose.model('Locations');

export const countriesController = (app) => {
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  app.get(`/${CMS_SERVER_VERSION}/countries`, getCountries);
  app.get(`/${CMS_SERVER_VERSION}/countries/next`, getCountriesSkipLimit);
  app.post(`/${CMS_SERVER_VERSION}/countries/description/save`, saveCountryFields);
};

function getCountries(req, res) {
  Locations.find({}, { country: 1 })
    .sort({ country: 1 })
    .lean()
    .exec((err, countries) => {
      res.json({ success: !err, msg: [], data: countries, error: err });
    });
}

function getCountriesSkipLimit(req, res) {
  const search = preparationQuery(req.query.search);
  const skip = parseInt(req.query.skip, 10) || 0;
  const limit = parseInt(req.query.limit, 10) || 18;
  const sort = preparationSort(req.query.sort);

  Locations.find(
    search,
    {
      country: 1,
      alias: 1,
      lat: 1,
      lng: 1,
      description: 1
    },
    {
      sort,
      skip,
      limit
    }
  )
    .lean()
    .exec((err, countries) => {
      res.json({ success: !err, msg: [], data: countries, error: err });
    });
}

function saveCountryFields(req, res) {
  const body = req.body;
  const description = body.description;
  const alias = body.alias;
  const lat = body.lat;
  const lng = body.lng;
  const id = body._id;

  Locations.update({ _id: id }, { $set: { description, alias, lat, lng } }).exec((err, num) => {
    res.json({ success: !err, msg: [], data: num, error: err });
  });
}

function preparationSort(sort) {
  let query = { country: 1 };

  if (sort) {
    query = JSON.parse(sort);
  }

  return query;
}

function preparationQuery(request): AdminsBaseQuery {
  const query: AdminsBaseQuery = {};

  if (request) {
    query.$or = [
      { country: { $regex: request, $options: 'i' } },
      { alias: { $regex: request, $options: 'i' } },
      { lat: { $regex: request, $options: 'i' } },
      { lng: { $regex: request, $options: 'i' } }
    ];
  }

  return query;
}
