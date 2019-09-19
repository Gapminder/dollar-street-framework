import { Application } from 'express';

export const embedController = (app: Application) => {
  require('./embed.controller')(app);
};
