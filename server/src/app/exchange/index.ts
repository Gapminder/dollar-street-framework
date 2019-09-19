import { Application } from 'express';

export const exchangeController = (app: Application) => {
  require('./exchange.controller')(app);
};
