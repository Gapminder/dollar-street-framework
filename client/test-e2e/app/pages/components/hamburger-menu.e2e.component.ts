import { $, ElementFinder } from 'protractor';
import { waitForVisible } from '../../helpers';

export class HamburgerMenu {
  static rootSelector: ElementFinder = $('main-menu');

  static menuBtn: ElementFinder = HamburgerMenu.rootSelector.$('div[data-e2e="main-menu-dropdown-open"]');
  static dropdownMenu: ElementFinder = HamburgerMenu.rootSelector.$('div[data-e2e="main-menu-dropdown-opened"]');
  static homeLink: ElementFinder = HamburgerMenu.rootSelector.$('a[data-e2e="main-menu-home"]');
  static quickGuide: ElementFinder = HamburgerMenu.rootSelector.$('a[data-e2e="main-menu-quick-guide"]');
  static aboutLink: ElementFinder = HamburgerMenu.rootSelector.$('a[data-e2e="main-menu-about"]');
  static donateLink: ElementFinder = HamburgerMenu.rootSelector.$('a[data-e2e="main-menu-donate"]');
  static mapLink: ElementFinder = HamburgerMenu.rootSelector.$('a[data-e2e="main-menu-map"]');
  static facebookIcon: ElementFinder = HamburgerMenu.rootSelector.$('.dropdown-menu .share-button.facebook');
  static comparisonButton: ElementFinder = HamburgerMenu.rootSelector.$('a[data-e2e="main-menu-comparison"]');

  static async open() {
    await waitForVisible(this.menuBtn);
    await this.menuBtn.click();
    await waitForVisible(this.dropdownMenu);
  }

  static async goToHome() {
    await this.open();
    await this.homeLink.click();
  }

  static async goToAboutPage() {
    await this.open();
    await this.aboutLink.click();
  }

  static async goToDonatePage() {
    await this.open();
    await this.donateLink.click();
  }

  static async goToMapPage() {
    await this.open();
    await this.mapLink.click();
  }

  static async openQuickGuide() {
    await this.open();
    await this.quickGuide.click();
  }

  static async openEmbedModal() {
    await this.open();
    await this.comparisonButton.click();
  }
}
