import {
  $,
  browser,
  by,
  element,
  ElementArrayFinder,
  ElementFinder,
  protractor,
  ProtractorExpectedConditions
} from 'protractor';

export class AbstractPage {
  static url = `${browser.baseUrl}${browser.params.baseHref}`;

  static loader: ElementFinder = element.all(by.css('div[class*="loader"]')).first();
  static menuIcon: ElementFinder = $('span[class*="menu-icon"]');
  static gamburgerMenuLinks: ElementArrayFinder = element.all(by.css('ul[class*="menu-list"] a'));
  static getTimeout: number = 1000;
  static logoIcon: ElementFinder = $('[class="logo"]');

  static getEC(): ProtractorExpectedConditions {
    return protractor.ExpectedConditions;
  }
}
