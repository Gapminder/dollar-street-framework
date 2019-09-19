import { browser, protractor } from 'protractor';
import { FamilyPage, MatrixPage } from '../../pages';
import { Header, MatrixImagePreview, WelcomeWizard } from '../../pages/components';
import { getRandomNumber, waitForVisible } from '../../helpers';
import { waitForInvisibility } from '../../helpers/common-helper';

describe('Matrix Page: Filters', () => {
  beforeEach(async () => {
    await browser.get(MatrixPage.url);

    // TODO quick guide could broke tests
    await WelcomeWizard.disableWizard();
    await MatrixPage.waitForSpinner();
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

  it('Country filters is closed on Esc button', async () => {
    await Header.countryFilter.click();
    await waitForVisible(Header.countryFilterContainer);
    expect(Header.countryFilterContainer.isDisplayed()).toBeTruthy(`Country filter isn't appear`);
    await browser
      .actions()
      .sendKeys(protractor.Key.ESCAPE)
      .perform();
    await waitForInvisibility(Header.countryFilterContainer);
    expect(Header.countryFilterContainer.isDisplayed()).toBeFalsy(`Country filter is present after Esc button press`);
  });

  xit('Income filter is closed on Esc button', async () => {
    await Header.incomeFilter.click();
    await waitForVisible(Header.incomeFilterContainer);
    expect(Header.incomeFilterContainer.isDisplayed()).toBeTruthy(`Things filter isn't appear`);
    await browser
      .actions()
      .sendKeys(protractor.Key.ESCAPE)
      .perform();
    await waitForInvisibility(Header.incomeFilterContainer);
    expect(Header.incomeFilterContainer.isDisplayed()).toBeFalsy(`Things filter is present after Esc button press`);
  });

  it('Filter by Country', async () => {
    const COUNTRY = 'Sweden';
    await waitForVisible(MatrixPage.familyLink.get(0));
    const totalCountriesBefore = await MatrixPage.familyLink.count();

    await Header.filterByCountry(COUNTRY);
    await MatrixPage.waitForImageSpinner();

    const totalCountriesAfter = await MatrixPage.familyLink.count();

    expect(totalCountriesBefore).toBeGreaterThan(totalCountriesAfter);

    const allImagesOnMatrix = await MatrixPage.getAllImages();

    await Promise.all(
      allImagesOnMatrix.map(async (family) => {
        expect(await family.getCountryName()).toEqual(COUNTRY);
      })
    );
    expect(await Header.countryFilter.getText()).toEqual(COUNTRY);
    expect(await browser.getCurrentUrl()).toContain(`countries=${COUNTRY}`);
  });

  it('Filter by two countries', async () => {
    const COUNTRY1 = 'Italy';
    const COUNTRY2 = 'Bangladesh';
    await waitForVisible(MatrixPage.familyLink.get(0));
    const totalCountriesBefore = await MatrixPage.familyLink.count();

    await Header.filterByCountry(COUNTRY1, COUNTRY2);
    await MatrixPage.waitForSpinner();
    await MatrixPage.waitForImageSpinner();
    const totalCountriesAfter = await MatrixPage.familyLink.count();

    expect(totalCountriesBefore).toBeGreaterThan(totalCountriesAfter);

    const allImagesOnMatrix = await MatrixPage.getAllImages();

    await Promise.all(
      allImagesOnMatrix.map(async (family) => {
        const countryName = await family.getCountryName();
        expect(countryName.includes(COUNTRY1) || countryName.includes(COUNTRY2)).toBeTruthy(
          `expected ${countryName} to include ${COUNTRY1} or ${COUNTRY2}`
        );
      })
    );

    expect(await Header.countryFilter.getText()).toEqual(`${COUNTRY2} & ${COUNTRY1}`);
    expect(await browser.getCurrentUrl()).toContain(`countries=${COUNTRY2},${COUNTRY1}`);
  });

  it('Show all countries', async () => {
    const COUNTRY = 'Sweden'; // TODO: Remowe hardcode
    await waitForVisible(MatrixPage.familyLink.get(0));
    const totalCountriesBefore = await MatrixPage.familyLink.count(); // TODO: clarify and fix floating result
    await Header.filterByCountry(COUNTRY);
    await Header.filterByAllCountries();
    await MatrixPage.waitForImageSpinner();

    const totalCountriesAfter = await MatrixPage.familyLink.count();

    expect(await Header.countryFilter.getText()).toEqual('the World');
    expect(totalCountriesBefore).toEqual(totalCountriesAfter);
    expect(await browser.getCurrentUrl()).not.toContain(`countries=`);
  });

  it('Search in country filter', async () => {
    const COUNTRY = 'Pakistan'; //TODO: Remowe hardcode
    await waitForVisible(MatrixPage.familyLink.get(0));
    const totalCountriesBefore = await MatrixPage.familyLink.count();

    await Header.searchInCountryFilter(COUNTRY);

    const totalCountriesAfter = await MatrixPage.familyLink.count();

    expect(totalCountriesBefore).toBeGreaterThan(totalCountriesAfter);

    const allImagesOnMatrix = await MatrixPage.getAllImages();
    await Promise.all(
      allImagesOnMatrix.map(async (family) => {
        expect(await family.getCountryName()).toEqual(COUNTRY);
      })
    );

    expect(await Header.countryFilter.getText()).toEqual(COUNTRY);
    expect(await browser.getCurrentUrl()).toContain(`countries=${COUNTRY}`);
  });

  xit('Filter by Income: currency and income updated in images list', async () => {
    const expectedCurrency = {
      name: 'Euro',
      symbol: '€',
      code: 'eur'
    };

    // get all families incomes before applying new filter
    const allFamiliesOnMatrixBefore = await MatrixPage.getAllImages();
    const allIncomesBefore = await Promise.all(
      allFamiliesOnMatrixBefore.map(async (family) => await family.getIncome())
    );

    await Header.filterByIncome(expectedCurrency.name);

    // get all families incomes after applying new filter
    const allFamiliesOnMatrixAfter = await MatrixPage.getAllImages();
    const allIncomesAfter = await Promise.all(
      allFamiliesOnMatrixAfter.map(async (family) => {
        const currency = await family.getCurrency();
        const income = await family.getIncome();

        return { currency, income };
      })
    );

    // check that all families have chosen currency and income has changed
    allIncomesAfter.forEach((familyIncome, i) => {
      expect(familyIncome.currency).toEqual(expectedCurrency.symbol);
      expect(familyIncome.income).toBeLessThan(allIncomesBefore[i]); // --> euro is more valuable then $
    });
    expect(await browser.getCurrentUrl()).toContain(`currency=${expectedCurrency.code}`);
  });

  xit('Filter by Income: currency and income updated in image preview', async () => {
    const random = getRandomNumber();
    const expectedCurrency = {
      name: 'Krona',
      symbol: 'kr',
      code: 'sek'
    };

    const family = MatrixPage.getFamily(random);
    const familyIncomeBefore = await family.getIncome();

    await Header.filterByIncome(expectedCurrency.name);

    const familyPreview: MatrixImagePreview = await family.openPreview();

    expect(await familyPreview.getCurrency()).toEqual(expectedCurrency.symbol);
    expect(await familyPreview.getIncome()).toBeGreaterThan(familyIncomeBefore); // $ is more valuable than krona
    expect(await browser.getCurrentUrl()).toContain(`currency=${expectedCurrency.code}`);
  });

  // Failed because of https://github.com/Gapminder/dollar-street-framework/issues -> https://github.com/Gapminder/dollar-street-pages/issues/1096
  xit('Filter by Income: currency and income updated in image preview when imagePreview is opened', async () => {
    const random = getRandomNumber();
    const expectedCurrency = {
      name: 'Krona',
      symbol: 'kr',
      code: 'sek'
    };

    const family = MatrixPage.getFamily(random);
    const familyIncomeBefore = await family.getIncome();

    const familyPreview: MatrixImagePreview = await family.openPreview();

    await Header.filterByIncome(expectedCurrency.name);

    expect(await familyPreview.getCurrency()).toEqual(expectedCurrency.symbol);
    expect(await familyPreview.getIncome()).toBeGreaterThan(familyIncomeBefore); // $ is more valuable than krona
    expect(await browser.getCurrentUrl()).toContain(`currency=${expectedCurrency.code}`);
  });

  xit('Filter by Income: currency updated on family page)', async () => {
    const random = getRandomNumber();
    const expectedCurrency = {
      name: 'Euro',
      symbol: '€',
      code: 'eur'
    };

    await Header.filterByIncome(expectedCurrency.name);
    const family = MatrixPage.getFamily(random);
    const familyPreview: MatrixImagePreview = await family.openPreview();

    await familyPreview.visitThisHomeBtn.click();
    await FamilyPage.familyIncome
      .getText()
      .then((familyIncome) => familyIncome.replace(/(\d).*/g, '').trim())
      .then((familyCurrency) => {
        expect(familyCurrency).toEqual(expectedCurrency.symbol);
      });
  });
});
