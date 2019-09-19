import { Application } from 'express';

export const commonController = (app: Application) => {
  require('./countries-filter.controller')(app);
  require('./download-image.controller')(app);
  require('./footer.controller')(app);
  require('./onboarding.controller')(app);
  require('./short-url.controller')(app);
  require('./street-settings.controller')(app);
  require('./things-filter.controller')(app);
  require('./thing.controller')(app);
};
