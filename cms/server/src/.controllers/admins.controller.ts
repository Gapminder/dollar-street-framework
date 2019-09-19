import { adminMedia } from '../admins/admin_media';
import { adminAllImagesEdit } from '../admins/admin_all_images_edit';
import { adminPlaces } from '../admins/admin_places';
import { adminImagesPerOnePlace } from '../admins/admin_images_per_one_place';
import { countriesController } from '../admins/countries.controller';

export const admins = (app) => {
  adminMedia(app);
  adminAllImagesEdit(app);
  adminPlaces(app);
  adminImagesPerOnePlace(app);
  countriesController(app);
};
