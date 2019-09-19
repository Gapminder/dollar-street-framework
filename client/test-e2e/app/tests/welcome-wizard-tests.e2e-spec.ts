import { browser } from 'protractor';

import { DataProvider } from '../data/data-provider';
import { HamburgerMenu, WelcomeWizard } from '../pages/components';
import { AbstractPage, MapPage, MatrixPage } from '../pages';
import { waitForLoader } from '../helpers/common-helper';

describe('Welcome wizard', () => {
  beforeEach(async () => {
    await browser.get(AbstractPage.url);
    await browser.executeScript('window.localStorage.clear()'); // clear localStorage to reveal WelcomeWizard
    await browser.refresh();
    await MatrixPage.waitForSpinner();
  });

  it('Check text on Welcome wizard', async () => {
    for (const [name, { element, actualResult }] of Object.entries(DataProvider.welcomeWizardText)) {
      expect(await element().getText()).toEqual(actualResult);
    }
  });

  it('Close Welcome wizard via close icon', async () => {
    await WelcomeWizard.closeIcon.click();

    expect(await WelcomeWizard.quickGuideContainer.isPresent()).toBeFalsy('Welcome Wizard should be closed');
    expect(await browser.executeScript('return window.localStorage.getItem("quick-guide")')).toEqual('true');
  });

  it('Close Welcome wizard via Maybe later button', async () => {
    await HamburgerMenu.openQuickGuide();
    await WelcomeWizard.maybeLaterBtn.click();

    expect(await WelcomeWizard.quickGuideContainer.isPresent()).toBeFalsy('Welcome Wizard should be closed');
    expect(await browser.executeScript('return window.localStorage.getItem("quick-guide")')).toEqual('true');
  });

  it('Open Welcome wizard', async () => {
    await WelcomeWizard.disableWizard();
    await waitForLoader();
    await HamburgerMenu.openQuickGuide();

    expect(await WelcomeWizard.quickGuideContainer.isDisplayed()).toBeTruthy('Welcome Wizard should be opened');
  });

  it('Open Welcome wizard from another page(not default)', async () => {
    await browser.get(MapPage.url);

    await HamburgerMenu.openQuickGuide();

    expect(await browser.getCurrentUrl()).toContain('matrix');
    expect(await WelcomeWizard.quickGuideContainer.isDisplayed()).toBeTruthy('Welcome Wizard should be opened');
  });
});
