import { Application } from 'express';

export const photographerController = (app: Application) => {
  require('./photographer-profile.controller')(app);
  require('./photographer-places.controller')(app);
};
