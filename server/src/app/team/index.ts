import { Application } from 'express';

export const teamController = (app: Application) => {
  require('./team.controller')(app);
};
