import { browser } from 'protractor';

import { DataProvider } from '../data/data-provider';
import { CountryPage, FamilyPage, MapPage, MatrixPage } from '../pages';
import { Footer, MatrixImagePreview } from '../pages/components';
import { getRandomNumber } from '../helpers';

describe('Country Page test', () => {
  afterAll(async () => {
    await Footer.checkFooterText();
    await Footer.checkFooterImages();
  });

  for (let i = 0; i < 2; i++) {
    it(`Check country ${i} on Country Page: name, numbers, map, markers, texts`, async () => {
      await MapPage.open();

      const country = await MapPage.getCountry(i);
      const countryName = await MapPage.getCountry(i).getText();
      await country.click();
      expect(await CountryPage.getCountryName()).toEqual(countryName);
      expect(await CountryPage.getNumberOfFamilies()).toEqual(await CountryPage.countNumberOfFamilies());
      expect(await CountryPage.miniMap.isPresent()).toBeTruthy();
      expect(await CountryPage.markerOnMap.isPresent()).toBeTruthy();

      for (const [name, { element }] of Object.entries(DataProvider.countryPageText)) {
        expect(await element().isPresent()).toBeTruthy();
      }
    });
  }

  it('click on familyImage navigates to family page', async () => {
    await openCountryPage();

    const placeId = await CountryPage.getFamilyId();
    const familyName = await CountryPage.getFamilyName();

    await CountryPage.familyImage.click();

    expect(await browser.getCurrentUrl()).toContain('family?place');
    expect(await browser.getCurrentUrl()).toContain(placeId);
    expect(await FamilyPage.familyName.getText()).toEqual(`${familyName} family`);
  });

  it('visitFamily btn leads to family page', async () => {
    await openCountryPage();

    const placeId = await CountryPage.getFamilyId(0);
    await CountryPage.visitFamilyBtns.get(0).click();

    expect(await browser.getCurrentUrl()).toContain('family?place');
    expect(await browser.getCurrentUrl()).toContain(placeId);
  });

  it('click on minimap leads to Map page', async () => {
    await openCountryPage();

    await CountryPage.miniMap.click();

    expect(await browser.getCurrentUrl()).toEqual(MapPage.url);
  });

  it('button "all families in ..." leads to Matrix page with filter by the country', async () => {
    await openCountryPage();
    const country = await CountryPage.getCountryName();

    await CountryPage.allFamiliesBtn.click();
    await MatrixPage.waitForImageSpinner();

    const chosenCountryInFilterOnMatrix = await MatrixPage.filterByCountry.getText();

    expect(await browser.getCurrentUrl()).toContain(`countries=${country}`);
    expect(chosenCountryInFilterOnMatrix).toEqual(country);
  });

  it('check base elements presence on Country page', async () => {
    await MatrixPage.open();
    const familyLink = await MatrixPage.familyLink.get(getRandomNumber());
    await familyLink.click();
    await new MatrixImagePreview().visitThisHomeBtn.click();
    await FamilyPage.waitForSpinner();
    await FamilyPage.miniMap.click();

    const visitedFamilies = Number(await CountryPage.numberOfFamilies.getText());
    const numberOfFamilies = await CountryPage.numberOfFamiliesEach.count();

    expect(numberOfFamilies).toEqual(visitedFamilies);

    const textInTotalPhotosLabel = Number(await CountryPage.numberOfPhotos.getText());

    const rawAllPhotos = await CountryPage.numberOfPhotosEachFamily.asElementFinders_();
    const allPhotos = await Promise.all(rawAllPhotos.map(async (el) => Number(await el.getText())));
    const sumOfAllPhotos = allPhotos.reduce((total, curr) => total + curr);

    expect(textInTotalPhotosLabel).toEqual(sumOfAllPhotos);
  });
});

async function openCountryPage(): Promise<void> {
  await MapPage.open();
  await MapPage.getCountry(0).click();
}
