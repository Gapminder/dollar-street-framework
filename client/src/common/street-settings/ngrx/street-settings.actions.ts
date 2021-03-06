import { Action } from '@ngrx/store';

export const SET_STREET_SETTINGS = 'SET_STREET_SETTINGS';
export const GET_STREET_SETTINGS = 'GET_STREET_SETTINGS';
export const GET_STREET_SETTINGS_SUCCESS = 'GET_STREET_SETTINGS_SUCCESS';
// export const SHOW_STREET_ATTRS: string = 'SHOW_STREET_ATTRS';
export const UPDATE_STREET_FILTERS = 'UPDATE_STREET_FILTERS';

export class SetStreetSettings implements Action {
  readonly type = SET_STREET_SETTINGS;
  constructor(public payload: any) {}
}

export class GetStreetSettings implements Action {
  readonly type = GET_STREET_SETTINGS;
}

export class GetStreetSettingsSuccess implements Action {
  readonly type = GET_STREET_SETTINGS_SUCCESS;
  constructor(public payload: any) {}
}

export class UpdateStreetFilters implements Action {
  readonly type = UPDATE_STREET_FILTERS;
  constructor(public payload: any) {}
}

/*export class ShowStreetAttrs implements Action {
    readonly type = SHOW_STREET_ATTRS;
    constructor(public payload: boolean) {}
}*/

export type Actions = SetStreetSettings | GetStreetSettingsSuccess | SetStreetSettings | UpdateStreetFilters;
// | ShowStreetAttrs;
