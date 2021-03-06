import { browser } from 'protractor';

import { MatrixPage } from '../../pages';
import { Footer } from '../../pages/components';
import { disableAnimations, getRandomNumber, waitForVisible } from '../../helpers';
import {
  getRandomString,
  switchWindow,
  waitForInvisibility,
  waitForURLContain,
  waitTillWindowClosed
} from '../../helpers/common-helper';
import { FacebookPage } from '../../pages/social-networks/facebook.page';
import { HamburgerMenu } from '../../pages/components/hamburger-menu.e2e.component';

let messageText: string;
let familyNumber: number;
describe('Facebook test', () => {
  beforeAll(async () => {
    messageText = getRandomString(12);
    familyNumber = getRandomNumber();
    await browser.get(MatrixPage.url);
    waitForInvisibility(MatrixPage.spinner);
    await browser
      .actions()
      .mouseMove(MatrixPage.familyLink.get(10))
      .perform();
    await disableAnimations();
  });

  xit('Check user can share to facebook from floating footer', async () => {
    await MatrixPage.familyLink.get(familyNumber).click();

    const urlBefore = await browser.getCurrentUrl();
    await Footer.facebookIcon.click();

    await switchWindow(1);
    await browser.waitForAngularEnabled(false);
    await FacebookPage.addPost(messageText);

    await switchWindow(0);
    await FacebookPage.navigateAndClickOnLastPost();
    await switchWindow(1);
    await browser.waitForAngularEnabled(true);
    await waitForURLContain('matrix');

    await MatrixPage.waitForSpinner();
    expect(urlBefore).toContain('activeHouse=' + (familyNumber + 1));

  });

  it('Check user can share to facebook from menu', async () => {
    familyNumber = getRandomNumber();
    await MatrixPage.familyLink.get(familyNumber).click();

    const urlBefore = await browser.getCurrentUrl();
    await browser.waitForAngularEnabled(true);
    await HamburgerMenu.menuBtn.click();
    await waitForVisible(HamburgerMenu.facebookIcon);
    await HamburgerMenu.facebookIcon.click();
    await switchWindow(2);
    await browser.waitForAngularEnabled(false);

    await waitForVisible(FacebookPage.messageBox);
    await FacebookPage.addMessage(messageText);
    await FacebookPage.post();
    await waitTillWindowClosed();
    await browser.sleep(3000); // Delay needed to get the post to appear on facebook.

    await switchWindow(1);
    await FacebookPage.navigateAndClickOnLastPost();
    await switchWindow(2);
    await browser.waitForAngularEnabled(true);
    await waitForURLContain('matrix');

    await MatrixPage.waitForSpinner();
    expect(urlBefore).toContain('activeHouse=' + (familyNumber + 1));

  });
});
