import { $, $$, browser, ElementArrayFinder, ElementFinder, ExpectedConditions as EC } from 'protractor';

import { FamilyImage } from './components';
import { ApiHelper } from '../helpers/api-helper';
import { AbstractPage } from './abstract.page';
import { waitForVisible } from '../helpers';
import { waitForInvisibility, waitForPresence } from '../helpers/common-helper';

export class FamilyPage {
  static url = `${AbstractPage.url}/family`;

  static familyName: ElementFinder = $$('p[class="title desktop"]').get(1);
  static familyCountry: ElementFinder = $('.home-country-container .title');
  static familyIncome: ElementFinder = $$('p[class="title"]').get(1);
  static familyImages: ElementArrayFinder = $$('.family-image');
  static familyPhoto: ElementFinder = $('.home-description-container [class="image-container"] img');
  static familyInfoImage: ElementFinder = $('.about-info-image');
  static familyInfoPopupHeader: ElementFinder = $('.about-data-header');
  static familyInfoPopup: ElementFinder = $('.about-data-container.open');
  static familyInfoCloseIcon: ElementFinder = FamilyPage.familyInfoPopupHeader.$('.closeMenu');
  static familyInfoPopupContent: ElementFinder = $('.about-data-body');

  static thingNameOnImg: ElementArrayFinder = $$('.e2e-name-on-image');
  static thingNameInBIS: ElementFinder = $('.header-container>span');
  static closeInBIS: ElementFinder = $('.close-block>img');
  static relatedSearchesInBIS: ElementFinder = $('.thing-button-container>p');
  static relatedLinksInBIS: ElementArrayFinder = $$('.thing-button-container>a');

  static miniMap: ElementFinder = $('.map.map_gray');
  static allFamiliesBtn: ElementFinder = $('.go-to-matrix');
  static littleStreet: ElementFinder = $('#chart');
  static homeOnLittleStreet: ElementFinder = $('[class="hover"]');
  static spinner: ElementFinder = $('[class="load"]');

  static getFamilyImage(index = 0): FamilyImage {
    return new FamilyImage(this.familyImages.first().locator().value, index);
  }

  static async getFamyliId(): Promise<string> {
    const url = await browser.getCurrentUrl();
    let placeId: string;

    try {
      placeId = url.match(/place=(\w+|\d+)/)[1];
    } catch (error) {
      throw new Error(`Check regexp in getFamyliId(): ${error}`);
    }

    return placeId;
  }

  static async getFamilyRegion(): Promise<string> {
    const familyId = await this.getFamyliId();
    const request = await ApiHelper.doGet(`${browser.params.apiUrl}/home-header?placeId=${familyId}`);

    return request.data.country.region;
  }

  static async waitForSpinner(): Promise<{}> {
    return browser.wait(EC.invisibilityOf(this.spinner), 15000);
  }

  static async openInfoPopup() {
    await waitForPresence(this.familyInfoImage);
    await this.familyInfoImage.click();
    await waitForVisible(this.familyInfoPopupContent);
  }

  static async closeInfoPopup() {
    await this.familyInfoCloseIcon.click();
    await waitForInvisibility(this.familyInfoPopupContent);
  }
}
