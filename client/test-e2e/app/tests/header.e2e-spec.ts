import { browser, protractor } from 'protractor';

import { AboutPage, AbstractPage, DonatePage, MapPage, MatrixPage } from '../pages';
import { HamburgerMenu, Header, WelcomeWizard } from '../pages/components';
import { getRandomNumber, waitForVisible } from '../helpers';
import { waitForInvisibility, waitForLoader } from '../helpers/common-helper';

describe('Header tests', () => {
  beforeEach(async () => {
    await browser.get(AbstractPage.url);
    await MatrixPage.waitForSpinner();
    await waitForLoader();
  });

  it('Language switcher is closed on Esc button press', async () => {
    await Header.languageSwitcher.click();
    await waitForVisible(Header.languageSwitcherContainer);
    expect(Header.languageSwitcherContainer.isDisplayed()).toBeTruthy(`Things filter isn't appear`);
    await browser
      .actions()
      .sendKeys(protractor.Key.ESCAPE)
      .perform();
    await waitForInvisibility(Header.languageSwitcherContainer);
    expect(Header.languageSwitcherContainer.isDisplayed()).toBeFalsy(`Things filter is present after Esc button press`);
  });

  it('Change language', async () => {
    const language = Header.languages.spanish;

    await Header.changeLanguage(language.name);
    const chosenLanguage = await Header.language.getText();

    expect(chosenLanguage).toEqual(language.name);
    expect(await Header.thingsFilter.getText()).toEqual('Familias'); // TODO: Delete hard code text
    expect(await Header.countryFilter.getText()).toEqual('El mundo');
    expect(await browser.getCurrentUrl()).toContain(`lang=${language.code}`);
  });

  xit('Click on logo reset all, but language, settings', async () => {
    const random = getRandomNumber();

    // tslint:disable-next-line:max-line-length
    await WelcomeWizard.disableWizard(); // TODO remove this after fix https://github.com/Gapminder/dollar-street-framework/issues -> https://github.com/Gapminder/dollar-street-pages/issues/1264
    await waitForLoader();
    await Header.changeLanguage(Header.languages.spanish.name);
    await waitForLoader();

    const urlSpanish = await browser.getCurrentUrl();
    const imagePreview = await MatrixPage.getFamily(random).openPreview();
    await imagePreview.visitThisHomeBtn.click();

    await Header.clickOnLogo();
    await browser.refresh();
    await waitForLoader();
    await waitForVisible(Header.rootSelector);
    const url = await browser.getCurrentUrl(); // Lang should not be reset by click on logo please see #1268
    expect(url).toEqual(urlSpanish); // Check that url lang param isn't changed after click on page logo.
  });

  describe('Check links in hamburger menu', () => {
    it('Open Donate Page', async () => {
      await HamburgerMenu.goToDonatePage();
      expect(await browser.getCurrentUrl()).toContain(DonatePage.url);
    });

    it('Open About Page', async () => {
      await HamburgerMenu.goToAboutPage();
      expect(await browser.getCurrentUrl()).toContain(AboutPage.url);
    });

    it('Open Map Page', async () => {
      await HamburgerMenu.goToMapPage();
      expect(await browser.getCurrentUrl()).toContain(MapPage.url);
    });

    it('Open QuickGuide', async () => {
      // tslint:disable-next-line:max-line-length
      // await WelcomeWizard.closeWizard(); // TODO uncomment this after fix https://github.com/Gapminder/dollar-street-framework/issues -> https://github.com/Gapminder/dollar-street-pages/issues/1264
      await HamburgerMenu.openQuickGuide();
      expect(await WelcomeWizard.rootSelector.isDisplayed()).toBeTruthy('QuickGuide should be opened');
    });

    it('Open QuickGuide when it was saved in LocalStorage', async () => {
      await WelcomeWizard.disableWizard();
      await waitForLoader();
      await HamburgerMenu.openQuickGuide();

      expect(await WelcomeWizard.rootSelector.isDisplayed()).toBeTruthy('QuickGuide should be opened');
    });

    it('Open Home page', async () => {
      await browser.get(MapPage.url);
      await waitForLoader();
      await HamburgerMenu.goToHome();

      expect(await browser.getCurrentUrl()).toContain(MatrixPage.url);
    });
  });
});
