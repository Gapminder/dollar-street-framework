import { Application } from 'express';

export const languageController = (app: Application) => {
  require('./language.controller')(app);
};
