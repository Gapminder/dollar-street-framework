import { Application } from 'express';
import { initController } from './init';
import { articlesController } from './articles';
import { commonController } from './common';
import { countryController } from './country';
import { homeController } from './home';
import { languageController } from './language';
import { mapController } from './map';
import { matrixController } from './matrix';
import { photographerController } from './photographer';
import { photographersController } from './photographers';
import { teamController } from './team';
import { donateController } from './donate';
import { embedController } from './embed';
import { exchangeController } from './exchange';

export const initApp = (app: Application) => {
  initController(app)
    .then(() => {
      articlesController(app);
      commonController(app);
      countryController(app);
      homeController(app);
      languageController(app);
      mapController(app);
      matrixController(app);
      photographerController(app);
      photographersController(app);
      teamController(app);
      donateController(app);
      embedController(app);
      exchangeController(app);
    })
    .catch((err) => {
      console.log('Error initialization: ', err);
    });
};
