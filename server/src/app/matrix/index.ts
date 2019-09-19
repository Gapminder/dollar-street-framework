import { Application } from 'express';

export const matrixController = (app: Application) => {
  require('./matrix.controller')(app);
  require('./matrix-block.controller')(app);
};
