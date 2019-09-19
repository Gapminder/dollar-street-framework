import { Application } from 'express';

export const donateController = (app: Application) => {
  require('./donate.controller')(app);
};
