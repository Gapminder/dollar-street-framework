import { Application } from 'express';

export const homeController = (app: Application) => {
  require('./home-header.controller')(app);
  require('./home-media.controller')(app);
  require('./home-media-view-block.controller')(app);
};
