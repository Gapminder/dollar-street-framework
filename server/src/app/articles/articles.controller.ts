import { Application, Request, Response } from 'express';
import { head } from 'lodash';

import { articleRepositoryService } from '../../repositories/article.repository.service';
import { thingRepositoryService } from '../../repositories/thing.repository.service';
import { ArticleData } from '../../interfaces/articleData';
import { ThingForArticles } from '../../interfaces/thingForArticles';
const articleTextLimit = 50;
const ERROR_CODE = 300;

module.exports = (app: Application) => {
  const compression = app.get('compression.middleware');
  const config = app.get('nconf');

  const BASE_HREF = config.get('BASE_HREF');

  app.get(`${BASE_HREF}/v1/article`, compression(), getArticle);
};

async function getArticle(req: Request, res: Response): Promise<Response | void> {
  try {
    const {
      query: { lang: langUse, id }
    } = req;

    const [thing, article] = await Promise.all([
      thingRepositoryService.getThingForArticles(id, langUse),
      articleRepositoryService.getArticleData(id, langUse)
    ]);
    if (!thing) {
      throw new Error(`Error: Thing ${id} were not found!`);
    }

    if (!article) {
      throw new Error(`Error: Article ${id} were not found!`);
    }

    const changedArticle: ArticleData = changeArticleDescription(article);
    const changedThing: ThingForArticles = changeThingName(thing);

    changedArticle.thing = changedThing.thingName;

    return res.json({ success: true, msg: [], data: changedArticle, error: null });
  } catch (err) {
    console.error(err);

    return res.json({ success: !err, msg: [], data: null, error: `Error code for articles: ${ERROR_CODE}` });
  }
}

function changeArticleDescription(article: ArticleData) {
  const articleTranslation = head(article.translations);
  // todo: investigate and determine the utility of use article.translated
  if (articleTranslation) {
    const areTransEqual: boolean =
      article.shortDescription.slice(0, articleTextLimit).replace(/\s+/g, '') ===
      articleTranslation.shortDescription.slice(0, articleTextLimit).replace(/\s+/g, '');

    article.translated = !areTransEqual;
    article.shortDescription = articleTranslation.shortDescription;
    article.description = articleTranslation.description;
  }

  delete article.translations;

  return article;
}

function changeThingName(thing: ThingForArticles) {
  const thingTranslation = head(thing.translations);

  if (thingTranslation) {
    thing.thingName = thingTranslation.thingName;

    delete thing.translations;
  }

  return thing;
}
