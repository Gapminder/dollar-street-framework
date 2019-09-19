import { Application } from 'express';

export const articlesController = (app: Application) => {
  require('./articles.controller')(app);
};
