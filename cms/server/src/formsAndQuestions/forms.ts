// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
// tslint:disable:no-floating-promises

import * as _ from 'lodash';
import * as async from 'async';
import * as mongoose from 'mongoose';
import { FormsQuery, QuestionEntity } from './forms-and-questions';

// tslint:disable-next-line:variable-name
const Forms = mongoose.model('Forms');
// tslint:disable-next-line:variable-name
const Places = mongoose.model('Places');
// tslint:disable-next-line:variable-name
const Questions = mongoose.model('Questions');

export const forms = (app) => {
  const hasUser = app.get('validate').hasUser;
  const isAdmin = app.get('validate').isAdmin;
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  app.get(`/${CMS_SERVER_VERSION}/forms/next`, hasUser, getNextFormsAndQuestionInForms);
  app.post(`/${CMS_SERVER_VERSION}/forms/new`, isAdmin, createForms);
  app.post(`/${CMS_SERVER_VERSION}/forms/edit/:id`, isAdmin, editForms);
  app.post(`/${CMS_SERVER_VERSION}/form/questions/:id`, isAdmin, formsQuestions);
  app.post(`/${CMS_SERVER_VERSION}/forms/remove/:id`, isAdmin, removeFormsAndUpdateQuestions);
  app.get(`/${CMS_SERVER_VERSION}/questionsAndForms`, hasUser, getQuestionsAndForms);
  app.get(`/${CMS_SERVER_VERSION}/forms`, isAdmin, getAllFormsForQuestion);
};

/**
 * Find all forms and numbers questions in forms
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function getNextFormsAndQuestionInForms(req, res) {
  const request = req.query;
  const skip = parseInt(request.skip, 10);
  const limit = parseInt(request.limit, 10);
  const query = preparationQuery(request);
  const sort = preparationSort(request);

  async.parallel(
    {
      forms: getFormsNext(skip, limit, query, sort),
      questionsInForm: getQuestionInForms
    },
    (err, results) => {
      if (err) {
        res.json({ success: err, msg: [], data: null, error: err });

        return;
      }

      const hashSetQuestionsInForm = _.reduce(
        results.questionsInForm,
        (result, question) => {
          result[question._id.toString()] = question.count;

          return result;
        },
        {}
      );

      _.each(results.forms, (form) => {
        form.questionsCount = hashSetQuestionsInForm[form._id.toString()];
      });

      /** @type Forms[] */
      const _forms = results.forms;
      res.json({ success: !err, msg: [], data: _forms, error: err });
    }
  );
}

/**
 * Create form
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function createForms(req, res) {
  /** @type Forms */
  const form = req.body;
  // tslint:disable-next-line:variable-name
  const Form = new Forms(form);

  Form.save((err, _form) => {
    res.json({ success: !err, msg: [], data: _form, error: err });
  });
}

/**
 * Update form
 * @param {String} req.params.id - form id
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function editForms(req, res) {
  const params = req.params;
  /** @type Forms */
  const form = req.body;

  Forms.update(
    { _id: params.id },
    {
      $set: {
        name: form.name,
        description: form.description
      }
    }
  ).exec((err, num) => {
    res.json({ success: !err, msg: [], data: num, error: err });
  });
}

/**
 * Update field form in questions
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function formsQuestions(req, res) {
  const body = req.body;
  /** @type Questions[] */
  const questions: QuestionEntity[] = body.question;

  async.each(
    questions,
    (question, cb) => {
      Questions.update(
        { _id: question._id },
        {
          $set: {
            forms: question.forms
          }
        }
      ).exec(cb);
    },
    (err) => {
      res.json({ success: !err, msg: [], data: true, error: err });
    }
  );
}

/**
 * Remove form and remove form from questions and place info
 * @param {String} req.params.id - form id
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function removeFormsAndUpdateQuestions(req, res) {
  const params = req.params;

  async.parallel(
    {
      places: removeFormInPlacesInfo(params.id),
      questions: removeFormInQuestions(params.id),
      forms: removeForms(params.id)
    },
    (err) => {
      res.json({ success: !err, msg: [], data: true, error: err });
    }
  );
}

/**
 * Find all forms and questions
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function getQuestionsAndForms(req, res) {
  async.parallel(
    {
      forms: getForms,
      questions: getQuestions
    },
    (err, results) => {
      res.json({ success: !err, msg: [], data: results, error: err });
    }
  );
}

function getFormsNext(skip, limit, query, sort) {
  return (cb) => {
    Forms.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(cb);
  };
}

function getAllFormsForQuestion(req, res) {
  Forms.find({}, { name: 1 })
    .lean()
    .exec((err, date) => {
      res.json({ success: !err, msg: [], data: date, error: err });
    });
}

function getForms(cb) {
  Forms.find({})
    .lean()
    .exec(cb);
}

/**
 * Find all questions
 * @param {Function} cb - callback
 * @returns {void} - nothing
 */
function getQuestions(cb) {
  Questions.find({})
    .lean()
    .exec(cb);
}

/**
 * Find the number of questions in the forms
 * @param {Function} cb - callback
 * @returns {void} - nothing
 */
function getQuestionInForms(cb) {
  Questions.collection
    .aggregate([
      {
        $unwind: '$forms'
      },
      {
        $group: {
          _id: '$forms._id',
          count: { $sum: 1 }
        }
      }
    ])
    .toArray(cb);
}

/**
 * Remove form in places info
 * @param {String} formId - form id
 * @returns {Function}
 */
function removeFormInPlacesInfo(formId) {
  return (cb) => {
    Places.collection
      .aggregate([
        {
          $match: {
            'info.forms': {
              $elemMatch: { formId }
            }
          }
        }
      ])
      .toArray((err, places) => {
        if (err) {
          cb(err);
        }

        _.each(places, (place) => {
          _.each(place.info, (info) => {
            if (info.forms && info.forms.length) {
              info.forms = _.filter(info.forms, (form) => form.formId !== formId);
            }
          });
        });

        async.each(
          places,
          (place, callback) => {
            Places.update(
              { _id: place._id },
              {
                $set: {
                  info: place.info
                }
              }
            ).exec(callback);
          },
          cb
        );
      });
  };
}

/**
 * Remove forms
 * @param {String} id - form id
 * @returns {Function}
 */
function removeForms(id) {
  return (cb) => {
    Forms.remove({ _id: id }).exec(cb);
  };
}

/**
 * Remove forms in questions
 * @param {String} id - form id
 * @returns {Function}
 */
function removeFormInQuestions(id) {
  return (cb) => {
    Questions.update(
      {
        forms: {
          $elemMatch: { _id: id }
        }
      },
      {
        $pull: {
          forms: { _id: id }
        }
      },
      {
        multi: true
      }
    ).exec(cb);
  };
}

function preparationQuery(request) {
  const query: FormsQuery = {};

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
