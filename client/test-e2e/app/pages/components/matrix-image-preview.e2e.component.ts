import { $, ElementArrayFinder, ElementFinder } from 'protractor';

import { isInViewport } from '../../helpers';
import { MatrixPage } from '../matrix.page';

const IMAGE_LOADING_TIMEOUT = 15000;

export class MatrixImagePreview {
  pattern = /^.*(\/)/; // grab everything to last slash
  patternId = /(?!\/)(\w+|\d+)$/g;
  rootSelector: ElementFinder = $('matrix-view-block');

  familyName: ElementFinder = this.rootSelector.$('.home-description-container h3');
  familyDescription: ElementFinder = this.rootSelector.$('.home-description-container .description-text p');
  familyPhotos: ElementArrayFinder = this.rootSelector.$$('.image-content>img');
  familyIncome: ElementFinder = this.rootSelector.$('.house-info-content .header-container');
  image: ElementFinder = this.rootSelector.$('.view-image-container > img');
  visitThisHomeBtn: ElementFinder = this.rootSelector
    .$$('.view-image-block-container .description-actions > a')
    .first(); // TODO add test attribute
  allFamiliesBtn: ElementFinder = this.rootSelector
    .$$('.view-image-block-container .description-actions > a.description-button')
    .last(); // TODO add test attribute
  miniMap: ElementFinder = this.rootSelector.$('region-map');
  photographerName: ElementFinder = this.rootSelector.$$('.photographer-container a').first(); // TODO add test attribute
  fullSizeBtn: ElementFinder = this.rootSelector.$('.zoom-download-container a'); // TODO add test attribute
  closeBtn: ElementFinder = this.rootSelector.$('.close-container');
  fullSizeImage: ElementFinder = this.rootSelector.$('.fancyBox-image');

  isDisplayed() {
    return Promise.all([
      expect(this.familyName.isDisplayed()).toBeTruthy(),
      expect(this.familyDescription.isDisplayed()).toBeTruthy(),
      expect(this.familyPhotos.isDisplayed()).toBeTruthy(),
      expect(this.familyIncome.isDisplayed()).toBeTruthy(),
      expect(this.image.isDisplayed()).toBeTruthy(),
      expect(this.visitThisHomeBtn.isDisplayed()).toBeTruthy(),
      expect(this.allFamiliesBtn.isDisplayed()).toBeTruthy(),
      expect(this.miniMap.isDisplayed()).toBeTruthy(),
      expect(this.photographerName.isDisplayed()).toBeTruthy(),
      expect(this.fullSizeBtn.isDisplayed()).toBeTruthy()
    ]);
  }

  isPresent() {
    return this.rootSelector.isPresent();
  }

  async isInViewport() {
    return await isInViewport(this.image);
  }

  async getImageSrc(): Promise<string> {
    return (await this.image.getAttribute('src')).match(this.pattern)[0];
  }

  async close(): Promise<void> {
    await this.closeBtn.click();
  }

  async openFullSizePreview(): Promise<void> {
    await this.image.click();
    await MatrixPage.waitForSpinner(IMAGE_LOADING_TIMEOUT,
      `Full size Image wasn't loaded in ${IMAGE_LOADING_TIMEOUT} sec`);
  }

  async getfullImageId(): Promise<string> {
    const backgroundImg = await this.fullSizeImage.getCssValue('background-image');

    return backgroundImg
      .replace('url("', '')
      .replace(/\"\)$/g, '')
      .match(this.patternId)[0];
  }

  async getFullSizeImageSrc(): Promise<string> {
    const backgroundImg = await this.fullSizeImage.getCssValue('background-image');

    return backgroundImg.replace('url("', '').match(this.pattern)[0];
  }

  async getPlaceId(): Promise<string> {
    return (await this.visitThisHomeBtn.getAttribute('href')).match(/place=(.*)/)[1];
  }

  async getCurrency(): Promise<string> {
    return this.familyIncome.getText().then(income => income.replace(/\d+.*/g, '').trim());
  }

  async getIncome(): Promise<string> {
    return this.familyIncome.getText().then(income => income.replace(/\D/g, ''));
  }
}
