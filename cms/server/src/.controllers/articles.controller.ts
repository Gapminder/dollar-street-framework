// tslint:disable:no-floating-promises

import * as async from 'async';
import * as mongoose from 'mongoose';

// tslint:disable-next-line:variable-name
const Things = mongoose.model('Things');
// tslint:disable-next-line:variable-name
const Articles = mongoose.model('Articles');

export const articles = (app) => {
  const isAdmin = app.get('validate').isAdmin;
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  app.get(`/${CMS_SERVER_VERSION}/article/:id`, isAdmin, getArticleData);
  app.put(`/${CMS_SERVER_VERSION}/article`, isAdmin, updateArticle);
  app.post(`/${CMS_SERVER_VERSION}/article`, isAdmin, createArticle);
};

function getArticleData(req, res) {
  const params = req.params;

  async.parallel(
    {
      thing: getThing(params.id),
      article: getArticle(params.id)
    },
    (error, result) => {
      if (error) {
        return res.json({ success: !error, msg: [], data: null, error });
      }

      if (!result.thing[0]) {
        return res.json({ success: false, msg: [], data: null, error: true });
      }

      const data: { thing: string; article?: string } = { thing: result.thing[0] };

      if (result.article) {
        data.article = result.article[0];
      }

      res.json({ success: !error, msg: [], data, error });
    }
  );
}

function updateArticle(req, res) {
  const article = req.body;
  const articleId = article._id;

  delete article._id;

  Articles.update({ _id: articleId }, { $set: article }).exec((err) => {
    res.json({ success: !err, msg: [], data: article, error: err });
  });
}

function createArticle(req, res) {
  const data = req.body;

  const article = new Articles(data);

  article.save((err, newArticle) => {
    res.json({ success: !err, msg: [], data: newArticle, error: err });
  });
}

function getThing(thingId) {
  return (cb) => {
    Things.find({ _id: thingId }, { thingName: 1 })
      .limit(1)
      .lean()
      .exec(cb);
  };
}

function getArticle(thingId) {
  return (cb) => {
    Articles.find({ thing: thingId })
      .limit(1)
      .lean()
      .exec(cb);
  };
}
