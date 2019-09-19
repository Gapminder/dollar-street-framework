// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
// tslint:disable:no-floating-promises

import * as _ from 'lodash';
import * as async from 'async';
import * as mongoose from 'mongoose';
import { QuestionQuery } from './forms-and-questions';

// tslint:disable-next-line:variable-name
const Forms = mongoose.model('Forms');
// tslint:disable-next-line:variable-name
const Places = mongoose.model('Places');
// tslint:disable-next-line:variable-name
const Questions = mongoose.model('Questions');

export const questions = (app) => {
  const isAdmin = app.get('validate').isAdmin;
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  app.get(`/${CMS_SERVER_VERSION}/questions/next`, isAdmin, getNextQuestions);
  app.get(`/${CMS_SERVER_VERSION}/questions`, isAdmin, getQuestions);
  app.post(`/${CMS_SERVER_VERSION}/questions/new`, isAdmin, createQuestion);
  app.post(`/${CMS_SERVER_VERSION}/questions/edit/:id`, isAdmin, editQuestion);
  app.post(`/${CMS_SERVER_VERSION}/questions/remove/:id/:customId`, isAdmin, removeQuestionAndQuestionsInPlaceInfo);

  // validation
  app.get(`/${CMS_SERVER_VERSION}/questions/validate/:fieldName/isUnique`, isAdmin, (req, res) => {
    const fieldName = req.params.fieldName;
    const value = req.query.value;
    const query = {};

    query[fieldName] = value;

    Questions.count(query).exec((err, count) => res.json({ success: !err, data: count === 0, error: err }));
  });
};

/**
 * Find all questions
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function getNextQuestions(req, res) {
  const request = req.query;
  const skip = parseInt(request.skip, 10);
  const limit = parseInt(request.limit, 10);
  const query = preparationQuery(request);
  const sort = preparationSort(request);

  async.parallel(
    {
      questions: getQuestionsPaging(skip, limit, query, sort),
      forms: getForms
    },
    (err, results) => {
      if (err) {
        res.json({ success: err, msg: [], data: null, error: err });

        return;
      }

      const _questions = results.questions;

      const hashSetFormsName = _.reduce(
        results.forms,
        (result, form) => {
          result[form._id.toString()] = form.name;

          return result;
        },
        {}
      );

      _.each(_questions, (question) => {
        question.formsName = _(question.forms)
          .map((questionForm) => hashSetFormsName[questionForm._id.toString()])
          .compact()
          .value();

        question.forms = void 0;
      });

      res.json({ success: !err, msg: [], data: _questions, error: err });
    }
  );
}

/**
 * Create question
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function createQuestion(req, res) {
  // tslint:disable-next-line:variable-name
  const Question = new Questions({
    id: req.body.id,
    name: req.body.name,
    description: req.body.description,
    type: req.body.type,
    list: req.body.list,
    listSelect: req.body.listSelect
  });

  Question.save((err, question) => {
    res.json({ success: !err, msg: [], data: question, error: err });
  });
}

/**
 * Update question
 * @param {String} req.params.id - question id
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function editQuestion(req, res) {
  const params = req.params;
  const body = req.body;

  Questions.update(
    { _id: params.id },
    {
      $set: {
        id: body.id,
        name: body.name,
        description: body.description || '',
        type: body.type,
        list: body.list || [],
        listSelect: body.listSelect || ''
      }
    }
  ).exec((err, num) => {
    res.json({ success: !err, msg: [], data: num, error: err });
  });
}

/**
 * Remove question and question in places info
 * @param {String} req.params.id - question id
 * @param {String} req.params.customId - question customId
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function removeQuestionAndQuestionsInPlaceInfo(req, res) {
  const params = req.params;

  async.parallel(
    {
      places: removeQuestionInPlaceInfo(params.customId),
      questions: removeQuestion(params.id)
    },
    (err, results) => {
      res.json({ success: !err, msg: [], data: results, error: err });
    }
  );
}

/**
 * Find all forms
 * @param {Function} cb - callback
 * @returns {void} - nothing
 */
function getForms(cb) {
  Forms.find({}, { name: 1 })
    .lean()
    .exec(cb);
}

/**
 * Find all questions
 * @param {Number} skip - skip
 * @param {Number} limit - limit
 * @param {Object} query - query
 * @param {Object} sort - sort
 * @returns {Function} cb - Function
 */
function getQuestionsPaging(skip, limit, query, sort) {
  return (cb) => {
    Questions.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(cb);
  };
}

function getQuestions(req, res) {
  Questions.find({})
    .lean()
    .exec((err, _questions) => {
      res.json({ success: err, msg: [], data: _questions, error: err });
    });
}

/**
 * Remove question in place info
 * @param {String} customId - question customId
 * @returns {Function} cb - Function
 */
function removeQuestionInPlaceInfo(customId) {
  return (cb) => {
    Places.update({}, { $pull: { info: { id: customId } } }, { multi: true }).exec(cb);
  };
}

/**
 * Remove question
 * @param {String} id - question id
 * @returns {Function} cb
 */
function removeQuestion(id) {
  return (cb) => {
    Questions.remove({ _id: id }).exec(cb);
  };
}

function preparationQuery(request) {
  const query: QuestionQuery = {};

  if (request.name && request.formId) {
    query.$or = [
      { id: { $regex: request.name, $options: 'ig' } },
      { name: { $regex: request.name, $options: 'ig' } },
      { description: { $regex: request.name, $options: 'ig' } }
    ];

    query['forms._id'] = request.formId;
  }

  if (request.name) {
    query.$or = [
      { id: { $regex: request.name, $options: 'ig' } },
      { name: { $regex: request.name, $options: 'ig' } },
      { description: { $regex: request.name, $options: 'ig' } }
    ];

    return query;
  }

  if (request.formId) {
    query['forms._id'] = request.formId;
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
