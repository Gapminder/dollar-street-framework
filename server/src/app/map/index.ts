import { Application } from 'express';

export const mapController = (app: Application) => {
  require('./map.controller')(app);
};
