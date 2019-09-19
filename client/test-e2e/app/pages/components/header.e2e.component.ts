import { $, $$, by, By, ElementArrayFinder, ElementFinder } from 'protractor';

export class Header {
  static rootSelector: ElementFinder = $$('.header-container').first();

  static thingsFilter: ElementFinder = Header.rootSelector.$('.things-filter-button-content');
  static thingsFilterContainer: ElementFinder = Header.rootSelector.$('.things-filter-container');
  static countryFilter: ElementFinder = Header.rootSelector.$('.countries-filter-button');
  static countryOption: ElementArrayFinder = Header.rootSelector.$$('.country-content');
  static countryFilterContainer: ElementFinder = Header.rootSelector.$$('.countries-filter-container').last();

  static incomeFilter: ElementFinder = Header.rootSelector.$('.income-title.filter');
  static incomeFilterContainer: ElementFinder = Header.rootSelector.$('.income-filter-desktop-container');
  static currencyBtn: ElementFinder = Header.rootSelector.$$('.control-section').first();
  static timeUnitBtn: ElementFinder = Header.rootSelector.$$('.control-section').last();
  static incomeOkBtn: ElementFinder = Header.rootSelector.$('.ok-button');

  static countryOkBtn: ElementFinder = Header.rootSelector.$('.ok-img');
  static showAllCountriesBtn: ElementFinder = Header.rootSelector.$('.pointer-container');
  static searchCounties: ElementFinder = Header.rootSelector.$$('.form-control').last();
  static countryInResult: ElementFinder = Header.rootSelector.$$('.country-content').first();
  // TODO make it works for array if needed

  static language: ElementFinder = Header.rootSelector.$('.active-languages');
  static languageSwitcher: ElementFinder = Header.rootSelector.$('.btn.dropdown-toggle');
  static languageSwitcherContainer: ElementFinder = Header.rootSelector.$('.dropdown-languages');

  static familyPageHeaderTitle: ElementFinder = Header.rootSelector.$('[data-e2e="family-header-text"]');
  static logoIcon: ElementFinder = Header.rootSelector.$('.logo');
  static headerTitle: ElementFinder = Header.rootSelector.$('.header-title');

  static languages = {
    english: {
      name: 'English',
      code: 'en-EN'
    },
    swedish: {
      name: 'Svenska',
      code: 'sv-SE'
    },
    spanish: {
      name: 'Español',
      code: 'es-ES'
    }
  };

  static async filterByCountry(...countries: string[]): Promise<void> {
    await this.countryFilter.click();
    await Promise.all(
      countries.map(
        async (country) => await this.rootSelector.element(by.cssContainingText('.country-content', country)).click()
      )
    );
    await this.countryOkBtn.click();
  }

  static async filterByAllCountries(): Promise<void> {
    await this.countryFilter.click();
    await this.showAllCountriesBtn.click();
    await this.countryOkBtn.click();
  }

  static async searchInCountryFilter(country: string): Promise<void> {
    await this.countryFilter.click();
    await this.searchCounties.clear();
    await this.searchCounties.sendKeys(country);
    await this.countryInResult.click();
    await this.countryOkBtn.click();
  }

  static async filterByIncome(currency: string): Promise<void> {
    await this.incomeFilter.click();
    await this.currencyBtn.click();
    await this.rootSelector.element(by.cssContainingText('.dropdown-item', currency)).click();
    await this.incomeOkBtn.click();
  }

  static async changeLanguage(newLang: string): Promise<void> {
    await this.languageSwitcher.click();
    await this.rootSelector.element(By.cssContainingText('.lang-selector', newLang)).click();
  }

  static async clickOnLogo(): Promise<void> {
    await this.logoIcon.click();
  }
}
