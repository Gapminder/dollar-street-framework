import { MapPage } from '../../pages';
import { Header } from '../../pages/components';
import { DataProvider } from '../../data/data-provider';
import { waitForInvisibility, waitForLoader, waitForVisible } from '../../helpers/common-helper';
import { browser, protractor } from 'protractor';

// TODO: un xit after https://dollarstreet.atlassian.net/browse/DS-248 implementation
describe('Map Page: Filters', () => {
  beforeEach(async () => {
    await MapPage.open();
  });

  it('Check clickability filters', async () => {
    await MapPage.getFilter('things').click();
    expect(await Header.thingsFilterContainer.isDisplayed()).toBeTruthy();
  });

  it('Map page title', async () => {
    expect(await MapPage.mapTitle.getText()).toEqual('on the World map');
  });

  it('Text in Search popup, and country count', async () => {
    for (const [name, { query, count }] of Object.entries(DataProvider.mapPageQueries)) {
      const countBefore = await MapPage.getCurrentCountryListCount();

      await MapPage.filterByThing.click();
      await MapPage.searchInFilterByThing.sendKeys(query);
      await MapPage.thingsFilterFirsResult.click();
      await waitForLoader();

      expect(await MapPage.selectedFilter.getText()).toEqual(query);
      expect(await MapPage.getCurrentCountryListCount()).not.toEqual(countBefore);
    }
  });

  it('Things filter is closed on Esc button', async () => {
    await Header.thingsFilter.click();
    await waitForVisible(Header.thingsFilterContainer);
    expect(Header.thingsFilterContainer.isDisplayed()).toBeTruthy(`Things filter isn't appear`);
    await browser
      .actions()
      .sendKeys(protractor.Key.ESCAPE)
      .perform();
    await waitForInvisibility(Header.thingsFilterContainer);
    expect(Header.thingsFilterContainer.isDisplayed()).toBeFalsy(`Things filter is present after Esc button press`);
  });
});
