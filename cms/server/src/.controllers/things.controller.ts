import { things } from '../things/things';
import { downloadAllImagesPerThing } from '../things/download_all_images_per_thing';

export const thingsController = (app) => {
  things(app);
  downloadAllImagesPerThing(app);
};
