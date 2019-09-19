import { browser } from 'protractor';

import { DataProvider } from '../../data/data-provider';
import { Footer } from '../../pages/components/footer.e2e.component';
import { Header } from '../../pages/components/header.e2e.component';

import { TeamPage } from '../../pages/team.page';

describe('Team Page test', () => {
  beforeAll(async () => {
    await browser.get(TeamPage.url);
  });
  afterAll(async () => {
    await Footer.checkFooterText();
    await Footer.checkFooterImages();
  });

  it('Check Team Page title', async () => {
    expect(await Header.headerTitle.getText()).toEqual(DataProvider.teamPageTitle);
  });

  it('Check basic elements on Team Page', async () => {
    for (const [name, { element }] of Object.entries(DataProvider.ambassadorsPageBoolean)) {
      expect(await element().isDisplayed()).toBeTruthy();
    }
  });
});
