import { $, browser, ElementFinder } from 'protractor';

export class WelcomeWizard {
  static rootSelector: ElementFinder = $('quick-guide');
  static quickGuideContainer: ElementFinder = WelcomeWizard.rootSelector.$('.quick-guide-container');
  static closeIcon: ElementFinder = WelcomeWizard.rootSelector.$('img[data-e2e="guide-close-icon"]');
  static quickTourBtn: ElementFinder = WelcomeWizard.rootSelector.$('button[data-e2e="guide-quick-tour"]');
  static maybeLaterBtn: ElementFinder = WelcomeWizard.rootSelector.$('button[data-e2e="guide-maybe-later"]');


  static async closeWizard(): Promise<void> {
    await this.closeIcon.click();
  }

  static async disableWizard(): Promise<void> {
    try {
      await browser.executeScript(() => {
        window.localStorage.setItem('quick-guide', 'true');
      });
      // ensure that it was used from local storage
      await browser.refresh();
    } catch (err) {
      throw new Error(err);
    }
  }
}
