import { $, browser } from 'protractor';

import { DataProvider } from '../data/data-provider';
import { AbstractPage, FamilyPage, PhotographersPage } from '../pages';
import { PhotographerPage } from '../pages/photographer.page';
import { Header } from '../pages/components';

describe('Photographer Page test', () => {
  it('click on family image leads to FamilyPage', async () => {
    await browser.get(`${AbstractPage.url}/photographers`);
    await PhotographersPage.photographerPortrait.first().click();

    const familyName = await PhotographerPage.getFamilyName();
    await PhotographerPage.familyImage.click();

    expect(await browser.getCurrentUrl()).toContain('family');
    expect(await FamilyPage.familyName.getText()).toContain(familyName);
    expect(await FamilyPage.familyName.getText()).toEqual(`${familyName} family`);
  });

  it('click on visitHome btn leads to FamilyPage', async () => {
    await browser.get(`${AbstractPage.url}/photographers`);
    await PhotographersPage.photographerPortrait.first().click();

    const familyName = await PhotographerPage.getFamilyName();
    await PhotographerPage.visitHomeBtn.first().click();

    expect(await browser.getCurrentUrl()).toContain('family');
    expect(await FamilyPage.familyName.getText()).toContain(familyName);
    expect(await FamilyPage.familyName.getText()).toEqual(`${familyName} family`);
  });
});

describe('Photographer Page: test direct opening', () => {
  for (const [name, { photographerLink }] of Object.entries(DataProvider.photographerLinks)) {
    it(`Check basic elements presence for ${name} photographer`, async () => {
      await browser.get(photographerLink);
      expect(await Header.headerTitle.isPresent()).toBeTruthy();
      expect(await PhotographerPage.totalPhotos.isPresent()).toBeTruthy();
      expect(await PhotographerPage.familyName.isPresent()).toBeTruthy();
    });
  }
});
