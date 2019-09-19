import { AbstractPage } from './abstract.page';
import { $, ElementFinder } from 'protractor';
import { waitForVisible } from '../helpers';
import { waitForLoader } from '../helpers/common-helper';
import { HamburgerMenu } from './components/hamburger-menu.e2e.component';
import { Header } from './components';

export class AboutPage {
  static url = `${AbstractPage.url}/about`;
  static pageContent: ElementFinder = $('#info-context');
  static visitDollarStreetLink: ElementFinder = AboutPage.pageContent.$('h2 a');
  static pageContentTitle: ElementFinder = AboutPage.pageContent.$('h1');
  static youtubeVideo: ElementFinder = $(`iframe[src='//www.youtube.com/embed/ndV1lm97398']`);
  static tedVideo: ElementFinder = $(`iframe[src='//www.youtube.com/embed/u4L130DkdOw']`);

  static async open(): Promise<void> {
    await HamburgerMenu.goToAboutPage();
    await waitForLoader();
    await waitForVisible(Header.headerTitle);
    await waitForVisible(this.pageContent);
  }
}
