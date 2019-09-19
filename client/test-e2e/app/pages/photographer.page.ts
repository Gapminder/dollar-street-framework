import { $, ElementArrayFinder, ElementFinder } from 'protractor';

import { AbstractPage } from './abstract.page';
import { Header } from './components';

export class PhotographerPage {
  static url = `${AbstractPage.url}/photographer`;

  static rootSelector: ElementFinder = $('photographer');

  static totalPhotos: ElementArrayFinder = PhotographerPage.rootSelector.$$('.photo');
  static familyBlocks: ElementArrayFinder = PhotographerPage.rootSelector.$$('.place');
  static familyName: ElementFinder = PhotographerPage.rootSelector.$('.family');
  static familyImage: ElementFinder = PhotographerPage.rootSelector.$('.place .image');
  static visitHomeBtn: ElementArrayFinder = PhotographerPage.rootSelector.$$('.custom-button');

  static async getFamilyImage(index = 0): Promise<ElementFinder> {
    return this.familyBlocks.get(index).$('.image');
  }

  static async getPhotographerName(): Promise<string> {
    const nameInHeader = await Header.headerTitle.getText();

    return nameInHeader.replace(/photographer:\s/i, '');
  }

  static async getFamilyName(index = 0): Promise<string> {
    return (await this.familyName.getText()).replace(/Family/g, '').trim();
  }
}
