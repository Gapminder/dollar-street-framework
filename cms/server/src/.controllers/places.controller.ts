import { places } from '../places/places.controller';
import { placeType } from '../places/placeType.controller';
import { approve } from '../places/approve.controller';

export const placesController = (app) => {
  places(app);
  placeType(app);
  approve(app);
};
