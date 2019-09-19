import { $, ElementFinder } from 'protractor';

import { isInViewport } from '../../helpers';
import { scrollIntoView } from '../../helpers/common-helper';
import { FamilyPage } from '../family.page';
import { MatrixPage } from '../matrix.page';

export class FamilyImagePreview {
  pattern = /^.*(\/)/; // grab everything to last slash
  rootSelector: ElementFinder = $('family-media-view-block');

  thingName: ElementFinder = this.rootSelector.$('.header-container');
  thingDescription: ElementFinder = this.rootSelector.$$('.house-info-content p').first(); // todo add test attribute
  thingInCountryFilter: ElementFinder = this.rootSelector.$('[data-e2e="e2e-thing-plural-country"]');
  thingInRegionFilter: ElementFinder = this.rootSelector.$('[data-e2e="e2e-thing-plural-region"]');
  thingInWorldFilter: ElementFinder = this.rootSelector.$('[data-e2e="e2e-thing-plural-world"]');

  image: ElementFinder = this.rootSelector.$('.view-image-content > img');

  photographerName: ElementFinder = this.rootSelector.$('[data-e2e="e2e-photographer-name"]');
  fullSizeBtn: ElementFinder = this.rootSelector.$$('.zoom-download-container a').last(); // TODO add test attribute
  fullSizeImage: ElementFinder = this.rootSelector.$$('.fancyBox-image').last(); // TODO add test attribute
  closeBtn: ElementFinder = this.rootSelector.$('.close-block');

  isDisplayed() {
    return Promise.all([
      expect(this.thingName.isDisplayed()).toBeTruthy(),
      expect(this.thingDescription.isDisplayed()).toBeTruthy(),
      expect(this.thingInCountryFilter.isDisplayed()).toBeTruthy(),
      expect(this.thingInRegionFilter.isDisplayed()).toBeTruthy(),
      expect(this.thingInWorldFilter.isDisplayed()).toBeTruthy(),
      expect(this.image.isDisplayed()).toBeTruthy(),
      expect(this.photographerName.isDisplayed()).toBeTruthy(),
      expect(this.fullSizeBtn.isDisplayed()).toBeTruthy(),
      expect(this.closeBtn.isDisplayed()).toBeTruthy()
    ]);
  }

  async isInViewport() {
    return await isInViewport(this.image);
  }

  isPresent() {
    return this.rootSelector.isPresent();
  }

  async getImageSrc(): Promise<string> {
    return (await this.image.getAttribute('src')).match(this.pattern)[0];
  }

  async close(): Promise<void> {
    // fixme: remove after fix https://github.com/Gapminder/dollar-street-framework/issues/ -> https://github.com/Gapminder/dollar-street-pages/issues/1284
    await scrollIntoView(this.closeBtn);
    await this.closeBtn.click();
  }

  async openFullSizePreview(page = 'family'): Promise<void> {
    await this.image.click();

    if (page === 'matrix') {
      await MatrixPage.waitForSpinner();
    }

    await FamilyPage.waitForSpinner();
  }

  async getFullImageId(): Promise<string> {
    const backgroundImg = await this.fullSizeImage.getCssValue('background-image');

    return backgroundImg
      .replace('url("', '')
      .replace(/\"\)$/g, '')
      .match(/(?!\/)(\w+|\d+)$/g)[0];
  }

  async getThingNamePlural(): Promise<string> {
    return this.thingInCountryFilter.getText();
  }
}
