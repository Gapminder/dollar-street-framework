import { Action } from '@ngrx/store';

export const COUNTRY_IMAGES_COUNT = 'COUNTRY_IMAGES_COUNT';

export class CountryImagesCount implements Action {
  readonly type = COUNTRY_IMAGES_COUNT;
  constructor(public payload: boolean) {}
}

export type Actions = CountryImagesCount;
