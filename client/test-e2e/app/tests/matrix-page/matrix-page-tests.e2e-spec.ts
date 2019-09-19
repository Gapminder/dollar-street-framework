import { browser } from 'protractor';

import { DataProvider } from '../../data/data-provider';
import { MatrixPage } from '../../pages';
import { Footer, HamburgerMenu, Header, Street } from '../../pages/components';

describe('Matrix Page: basic elements presence', () => {
  beforeAll(async () => {
    await browser.get(MatrixPage.url);
  });
  afterAll(async () => {
    await Footer.checkFooterText();
    await Footer.checkFooterImages();
  });

  it('IN, BY_INCOME, POOREST, RICHEST', async () => {
    for (const [name, { element, actualResult }] of Object.entries(DataProvider.matrixPageText)) {
      expect(await element()).toEqual(actualResult);
    }
  });

  it('Filters in header, street chart', async () => {
    expect(await HamburgerMenu.menuBtn.isDisplayed()).toBeTruthy();
    expect(await Header.logoIcon.isDisplayed()).toBeTruthy();
    expect(await Header.thingsFilter.isDisplayed()).toBeTruthy();
    expect(await Header.countryFilter.isDisplayed()).toBeTruthy();
    expect(await MatrixPage.thingNameOnFilter.isDisplayed()).toBeTruthy();
    expect(await MatrixPage.thingIconInFilter.isDisplayed()).toBeTruthy();
    expect(await Street.road.isDisplayed()).toBeTruthy();
  });

  it('Houses on street, family images', async () => {
    for (const [name, { element }] of Object.entries(DataProvider.matrixPageImages)) {
      expect(await element().isDisplayed()).toBeTruthy(`${name} not visible`);
    }
  });

  it('Icons in FilterByThing ', async () => {
    await MatrixPage.filterByThing.click();

    for (const [name, { element }] of Object.entries(DataProvider.matrixPageSearchBoolean)) {
      expect(await element().isDisplayed()).toBeTruthy(`${name} not visible`);
    }
    await MatrixPage.filterByThing.click();
  });

  it('Text in header', async () => {
    for (const [name, { element, actualResult }] of Object.entries(DataProvider.matrixPageSearchText)) {
      expect(await element().getText()).toEqual(actualResult);
    }
  });

  it('Text in header after selection thing', async () => {
    await MatrixPage.filterByThing.click();
    await MatrixPage.getThingLinkInSearch(2).click();

    for (const [name, { element, actualResult }] of Object.entries(DataProvider.matrixPageText)) {
      expect(await element()).toEqual(actualResult);
    }
  });

  it('Text in Search popup', async () => {
    for (const [name, { query }] of Object.entries(DataProvider.matrixPageQueries)) {
      await MatrixPage.filterByThing.click();
      await MatrixPage.searchInFilterByThing.sendKeys(query);
      await MatrixPage.searchInFilterByThing.clear();

      expect(await MatrixPage.getThingLinkInSearchInAllTopics.getText()).toEqual(query);
      await MatrixPage.filterByThing.click();
    }
  });

  it('Check clickability filters', async () => {
    await MatrixPage.getFilter('things').click();
    expect(await Header.thingsFilterContainer.isDisplayed()).toBeTruthy();

    await MatrixPage.getFilter('countries').click();
    expect(await Header.countryFilterContainer.isDisplayed()).toBeTruthy();
  });
});
