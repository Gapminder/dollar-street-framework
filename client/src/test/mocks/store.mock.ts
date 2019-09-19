import { Observable } from 'rxjs/Observable';

const defaultStreetSettings = {
  lowIncome: 30,
  highIncome: 60
};

export class StoreMock {
  select() {
    return Observable.of({
      streetSettings: {
        poor: defaultStreetSettings.lowIncome,
        rich: defaultStreetSettings.highIncome
      },
      timeUnit: {
        code: 'MONTH',
        name: 'Month',
        name1: 'Monthly income',
        per: 'month',
        translatedName: 'Monat',
        translationCode: 'Monat',
        translationIncome: 'Monatseinkommen'
      },
      translations: {
        ABOUT: 'about',
        HELP_TRANSLATE_TO: 'HELP_TRANSLATE_TO',
        PHOTOGRAPHERS: 'PHOTOGRAPHERS',
        PHOTOGRAPHER: 'PHOTOGRAPHER',
        SHOW_DETAILS: 'SHOW_DETAILS',
        HIDE_DETAILS: 'HIDE_DETAILS',
        MONTH: 'Monat',
        READ_MORE: 'READ_MORE',
        READ_LESS: 'READ_LESS'
      },
      data: {
        country: 'USA'
      }
    });
  }

  dispatch() {}
}
