import { $, $$, browser, by, element, ElementArrayFinder, ElementFinder } from 'protractor';

import { waitForLoader } from '../helpers/common-helper';
import { AbstractPage } from './abstract.page';
import { waitForVisible } from '../helpers';

export class MapPage {
  static url = `${AbstractPage.url}/map`;

  static mapImage: ElementFinder = $('.map-color');
  static countryLinks: ElementArrayFinder = $$('.country-name');
  static markers: ElementArrayFinder = $$('.marker');

  static familyPopup: ElementFinder = $('.hover_portrait_box');
  static familyPopupDescription: ElementFinder = $('.hover_portrait_description');
  static familyPopupStack: ElementFinder = $('[class^="hover_portrait shadow_to"]');
  static familyPopupLink: ElementFinder = MapPage.familyPopup.$('.see-all-span');
  static familyPopupCountyText: ElementFinder = MapPage.familyPopup.$('.country');
  static familyPopupIncome: ElementFinder = MapPage.familyPopup.$('.income');

  static sideFamiliesContainer: ElementFinder = $('.left-side-info.open');
  static sidePhotos: ElementArrayFinder = MapPage.sideFamiliesContainer.$$('.family-photo');
  static sideFamilyInfoBox: ElementArrayFinder = MapPage.sideFamiliesContainer.$$('.info-box');
  static sideFamilyCountry: ElementArrayFinder = MapPage.sideFamiliesContainer.$$('.country');
  static sideFamilyName: ElementArrayFinder = MapPage.sideFamiliesContainer.$$('.name');
  static sideFamilyIncome: ElementArrayFinder = MapPage.sideFamiliesContainer.$$('.income');
  static sideFamilyTitleLink: ElementFinder = MapPage.sideFamiliesContainer.$('.header a');
  static sideFamilyContainerClose: ElementFinder = MapPage.sideFamiliesContainer.$('.close-button');

  static searchInFilterByThing: ElementFinder = $('input[placeholder*="things"]');
  static filterByThing: ElementFinder = $('.things-filter-button-content');
  static mapTitle: ElementFinder = $('.map-things-text');
  static countryListBlock: ElementFinder = $('.row.countries-list');
  static allTopicsBox: ElementFinder = $('.other-things-content');
  static thingsFilterFirsResult: ElementFinder = MapPage.allTopicsBox.$$('.thing-name').first();
  static selectedFilter: ElementFinder = $$('.things-filter-button-content span').first();
  static countryList: ElementArrayFinder = MapPage.countryListBlock.$$('.row.countries-list li');

  static async open(): Promise<void> {
    await browser.get(this.url);
    await waitForLoader();
    await waitForVisible(this.mapImage);
    await waitForVisible(this.markers.first());
  }

  static async hoverFirstMarker() {
    await waitForVisible(this.markers.first());
    const mapMarker = await this.markers.first();
    await browser
      .actions()
      .mouseMove(mapMarker)
      .perform();
    await waitForVisible(this.familyPopupDescription);
    await waitForVisible(this.familyPopupLink);
  }

  static async openSideMenu() {
    await waitForVisible(this.familyPopupLink);
    await this.familyPopupLink.click();
    await waitForVisible(this.sideFamiliesContainer);
  }

  static getCountry(i: number): ElementFinder {
    return this.countryLinks.get(i);
  }
  static getSideFamilies(): ElementArrayFinder {
    return this.sidePhotos;
  }

  static async closeSideFamiliesContainer() {
    await this.sideFamilyContainerClose.click();
  }

  static getCurrentCountryListCount() {
    return this.countryList.count();
  }
  static getFilter(type: string): ElementFinder {
    return element(by.id(`${type}-filter`));
  }
}
