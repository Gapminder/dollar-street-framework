// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
// tslint:disable:no-floating-promises

import * as mongoose from 'mongoose';
import { PlaceTypeQuery } from '../../../../server/src/interfaces/places';

// tslint:disable-next-line:variable-name
const PlacesType = mongoose.model('TypesPlaces');

export const placeType = (app) => {
  const hasUser = app.get('validate').hasUser;
  const isAdmin = app.get('validate').isAdmin;
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  app.get(`/${CMS_SERVER_VERSION}/placesType/next`, hasUser, getNextPlacesType);
  app.get(`/${CMS_SERVER_VERSION}/placesType/names`, hasUser, getPlacesTypeNames);
  app.get(`/${CMS_SERVER_VERSION}/placesType`, hasUser, getPlacesType);

  app.post(`/${CMS_SERVER_VERSION}/placesType/new`, isAdmin, createNewPlaceType);
  app.post(`/${CMS_SERVER_VERSION}/placesType/edit/:id`, isAdmin, editPlaceType);
  app.post(`/${CMS_SERVER_VERSION}/placesType/remove/:id`, isAdmin, removePlaceType);
};

function getNextPlacesType(req, res) {
  const request = req.query;
  const skip = parseInt(request.skip, 10);
  const limit = parseInt(request.limit, 10);
  const query = preparationQuery(request);
  const sort = preparationSort(request);

  PlacesType.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean()
    .exec((err, placesTypes) => {
      /** @type {{success: boolean, msg: Array, data: {PlacesType[]}, error: {Error}}} */
      const response = { success: !err, msg: [], data: placesTypes, error: err };
      res.json(response);
    });
}

/**
 * get all place types
 * @param {HttpRequest} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function getPlacesType(req, res) {
  PlacesType.find({})
    .lean()
    .exec((err, placesTypes) => {
      /** @type {{success: boolean, msg: Array, data: {PlacesType[]}, error: {Error}}} */
      const response = { success: !err, msg: [], data: placesTypes, error: err };
      res.json(response);
    });
}

function getPlacesTypeNames(req, res) {
  PlacesType.find({}, { name: 1, _id: 0 })
    .lean()
    .exec((err, placesTypesNames) => {
      /** @type {{success: boolean, msg: Array, data: {PlacesType[]}, error: {Error}}} */
      const response = { success: !err, msg: [], data: placesTypesNames, error: err };
      res.json(response);
    });
}

/**
 * Create new place type
 * @param {String} req.body.name - new name for place type
 *
 * @param {HttpRequest} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function createNewPlaceType(req, res) {
  const type = req.body;

  // tslint:disable-next-line:variable-name
  const Type = new PlacesType({
    name: type.name
  });

  Type.save((err, data) => {
    /** @type {{success: boolean, msg: Array, data: {PlacesType}, error: {Error}}} */
    const response = { success: !err, msg: [], data, error: err };
    res.json(response);
  });
}

/**
 * Edit place by id
 * @param {ObjectId} req.params.id - place type id
 * @param {String} req.body.name - edit name for place type
 *
 * @param {HttpRequest} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function editPlaceType(req, res) {
  const param = req.params;
  const type = req.body;

  PlacesType.update({ _id: param.id }, { $set: { name: type.name } }).exec((err, num) => {
    /** @type {{success: boolean, msg: Array, data: Number, error: {Error}}} */
    const response = { success: !err, msg: [], data: num, error: err };
    res.json(response);
  });
}

/**
 * Remove place type by id
 * @param {{id: String}} req.params - id of place type to remove
 *
 * @param {Object} req - express request
 * @param {Object} res - express response
 * @returns {void} - nothing
 */
function removePlaceType(req, res) {
  const param = req.params;

  PlacesType.remove({ _id: param.id }).exec((err, num) => {
    /** @type {{success: boolean, msg: Array, data: Number, error: {Error}}} */
    const response = { success: !err, msg: [], data: num, error: err };
    res.json(response);
  });
}

function preparationQuery(request) {
  const query: PlaceTypeQuery = {};

  if (request.name) {
    query.name = { $regex: request.name, $options: 'i' };
  }

  return query;
}

function preparationSort(request) {
  let query = {};

  if (request.sort) {
    query = JSON.parse(request.sort);
  }

  return query;
}
