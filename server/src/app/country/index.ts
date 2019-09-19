import { Application } from 'express';

export const countryController = (app: Application) => {
  require('./country-info.controller')(app);
  require('./countries-places.controller')(app);
};
