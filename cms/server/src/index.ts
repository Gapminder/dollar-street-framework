import { initApplication } from './initApplication';
import { validationUser } from './user/user-validation.middleware';
import { sockets } from './.controllers/sockets.controller';
import { images } from './.controllers/medias.controller';
import { differences } from './comparisons/differences.controller';
import { similarities } from './comparisons/similarities.controller';
import { admins } from './.controllers/admins.controller';
import { authorizations } from './.controllers/authorizations.controller';
import { placesController } from './.controllers/places.controller';
import { thingsController } from './.controllers/things.controller';
import { uploads } from './.controllers/uploads.controller';
import { profiles } from './.controllers/users.controller';
import { formsAndQuestions } from './.controllers/forms-and-questions.controller';
import { categories } from './.controllers/categories.controller';
import { about } from './.controllers/about.controller';
import { onboarding } from './.controllers/onboarding.controller';
import { consumerAllImages } from './.controllers/consumer-all-images.controller';
import { info } from './.controllers/info.controller';
import { articles } from './.controllers/articles.controller';
import { footer } from './.controllers/footer.controller';
import { street } from './.controllers/street.controller';
import { thingsFilter } from './.controllers/things-filter.controller';
import { translations } from './.controllers/translations.controller';
import { strings } from './.controllers/strings.controller';

export const initSrc = (app) => {
  initApplication(app)
    .then(() => {
      validationUser(app);
      sockets(app);
      images(app);
      differences(app);
      similarities(app);
      admins(app);
      authorizations(app);
      placesController(app);
      thingsController(app);
      uploads(app);
      profiles(app);
      formsAndQuestions(app);
      categories(app);
      about(app);
      onboarding(app);
      consumerAllImages(app);
      info(app);
      articles(app);
      footer(app);
      street(app);
      thingsFilter(app);
      translations(app);
      strings(app);
    })
    .catch((err) => {
      console.log('Error initialization: ', err);
    });
};
