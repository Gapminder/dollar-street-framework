import * as request from 'request';
import { map, isEqual } from 'lodash-es';
let using = require('jasmine-data-provider');
let result1;
let result2;

import { DataProvider } from './data';
import { Instances } from './instances';
import { browser } from 'protractor';

describe('Map tests: check json from prod-api and apidev', () => {
  beforeEach(() => {
    browser.get('');
  });

  using(DataProvider.ThingNames, (data: any, description: any) => {
    it(description + ' Check json from full link', () => {
      request(Instances.prodApi + Instances.secondPartLinkForMap + data.thingName, (error: any, response: any, body: any) => {
        if (!error && response.statusCode === 200) {
          using(DataProvider.keysJsonForMap, (data: any) => {
            expect(body).toContain(data.key);
          });

          result1 = JSON.parse(body);

          if (!result1.data.places) {
            return;
          }

          result1.data.places = map(result1.data.places, (item) => {
            if(item) {
              delete item.image;
              delete item.background;
              delete item.photographer;
              delete item.interviewedPerson;
            }
            return item;
          });
        }
      });
      request(Instances.localHost + Instances.secondPartLinkForMap + data.thingName, (error: any, response: any, body: any) => {
        if (!error && response.statusCode === 200) {
          using(DataProvider.keysJsonForMap, (data: any) => {
            expect(body).toContain(data.key);
          });
          result2 = JSON.parse(body);

          if (!result2.data.places) {
            return;
          }

          result2.data.places = map(result2.data.places, (item) => {
            if(item) {
              delete item.image;
              delete item.background;
            }
            return item;
          });
        }
      });
      expect(result1.data.places).toEqual(result2.data.places);
      expect(result1.data.countries).toEqual(result2.data.countries);
      expect(isEqual(result1, result2)).toBeTruthy();
      expect(result1.data.places.length).toEqual(result2.data.places.length);
      expect(result1.data.countries.length).toEqual(result2.data.countries.length);
      expect(result1.data.thing).toEqual(result2.data.thing);
    });
  });
});
