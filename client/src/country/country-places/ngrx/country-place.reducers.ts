import * as CountryPlacesActions from './country-place.actions';
import { CountryPlacesImagesCount } from '../../../interfaces';

export const initialState = {
  CountryImagesCount: 0
};

export function countryPlacesReducer(
  state: CountryPlacesImagesCount = initialState,
  action: CountryPlacesActions.Actions
) {
  switch (action.type) {
    case CountryPlacesActions.COUNTRY_IMAGES_COUNT: {
      return Object.assign({}, state, { CountryImagesCount: action.payload });
    }

    default:
      return state;
  }
}
