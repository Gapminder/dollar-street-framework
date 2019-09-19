import { $, $$, browser, by, element, ElementArrayFinder, ElementFinder, ExpectedConditions as EC } from 'protractor';

import { FamilyImage, WelcomeWizard } from './components';
import { AbstractPage } from './abstract.page';

export class MatrixPage {
  static url = `${AbstractPage.url}/matrix`;

  static filterByThing: ElementFinder = $('.things-filter-button-content');
  static filterByCountry: ElementFinder = $('.countries-filter-button');
  static thingLinkInSearch: ElementArrayFinder = $$('.thing-name');
  static searchInFilterByThing: ElementFinder = $('input[placeholder*="things"]');
  static thingNameOnFilter: ElementFinder = $$('.things-filter-button-content>span').first();
  static thingIconInFilter: ElementFinder = $$('.things-filter-button-content>img').first();
  static familyLink: ElementArrayFinder = $$('matrix-images div[class*="image-content"]');
  static familyImages: ElementArrayFinder = $$('matrix-images div[class*="image-content"] .cell-inner');
  static placePagelink: ElementFinder = $('div[class*="mini-matrix-link"]');
  static thingInFilter: ElementFinder = $('.thing-name');
  static bigImageFromBigSection: ElementFinder = $('.view-image-container>img');
  static homeLink: ElementFinder = $('.home-description-container>a[angulartics2on="click"]');
  static getThingLinkInSearchInAllTopics: ElementFinder = $$('.other-things-content .thing-name').first();
  static getFloatFooterText: ElementArrayFinder = $$('div[class*="float-footer"] span');
  static getAngleUp: ElementFinder = $$('.back-to-top').first();
  static hamburgerMenu: ElementFinder = $('span[class="menu-icon"]');
  static maybeLaterBtnOnWelcomeHeader: ElementFinder = WelcomeWizard.maybeLaterBtn;
  static zoomIncrease: ElementFinder = $$('button.btn-plus').first();
  static zoomDecrease: ElementFinder = $$('button.btn-minus').first();
  static countryInFilter: ElementArrayFinder = $$('.name');
  static okButtonInCountryFilter: ElementFinder = $('.ok-img');

  static homeDescriptionContainer: ElementFinder = $('.home-description-container');
  static familyName: ElementFinder = MatrixPage.homeDescriptionContainer.$('>h3');
  static previewCloseBtn: ElementFinder = $('.close-container');
  static fancyPreview: ElementFinder = $('.fancyBox-image');
  static spinner: ElementFinder = $('[class="load"]');
  static imagesContainer: ElementFinder = $('.images-container .flex-container');
  static spinnerImageLoad: ElementFinder = MatrixPage.imagesContainer.$('.isLoad');
  static visitThisHomeBtn: ElementFinder = MatrixPage.homeDescriptionContainer.$('a[data-e2e="visit-this-home"]');
  static allFamiliesInCountryBtn: ElementFinder = MatrixPage.homeDescriptionContainer.$(
    'a[data-e2e="all-families-in"]'
  );
  static countryInImageDescription: ElementArrayFinder = $$('.place-image-box-country');
  static minimap: ElementFinder = $('#map-content');
  static photographerName: ElementFinder = $('.photographer-container a:nth-child(2)'); // TODO add test class
  static familyIncomeOnImage: ElementArrayFinder = $$('.place-image-box-income');
  static familyIncomeInPreview: ElementFinder = $('.matrix-view-block .header-container');
  static comparisonIconsOnImage: ElementArrayFinder = $$('matrix-images .comparison-image');
  static pinHeader: ElementFinder = $('.pin-header');

  static async open(): Promise<void> {
    browser.get(this.url);
    await this.waitForSpinner();
    await this.waitForImageSpinner();
  }

  static getFamily(index = 0): FamilyImage {
    this.waitForSpinner();

    return new FamilyImage(this.url, index);
  }

  static async getAllImages(): Promise<FamilyImage[]> {
    return (await this.familyLink.asElementFinders_()).map((family, i) => this.getFamily(i));
  }

  static getThingLinkInSearch(thingNumber: number): ElementFinder {
    return this.thingLinkInSearch.get(thingNumber);
  }

  static getLastThing(): ElementFinder {
    return this.familyLink.last();
  }

  static getFilter(type: string): ElementFinder {
    return element(by.id(`${type}-filter`));
  }

  static async waitForSpinner(timeout = 10000, message = ''): Promise<{}> {
    return browser.wait(EC.invisibilityOf(MatrixPage.spinner), timeout, message);
  }

  static async waitForImageSpinner(): Promise<{}> {
    return browser.wait(EC.invisibilityOf(this.spinnerImageLoad), 10000);
  }

  static async getFamilyIncome(index: number): Promise<number> {
    return this.familyIncomeOnImage
      .get(index)
      .getText()
      .then((income) => Number(income.replace(/\D/g, '')));
  }

  static async getFamilyIncomeFromPreviw(index: number): Promise<number> {
    return this.familyIncomeInPreview
      .get(index)
      .getText()
      .then((income) => Number(income.replace(/\D/g, '')));
  }

  static getShareButtonInHamburgerMenu(social: string): ElementFinder {
    return $(`main-menu div[class*="share-button ${social}"]`);
  }
}
