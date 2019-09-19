import { Application } from 'express';

export const photographersController = (app: Application) => {
  require('./photographers.controller')(app);
};
