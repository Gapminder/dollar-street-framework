'use strict';
import { ElementFinder } from 'protractor';
import { LogInPage } from './log-in-page';
import { credentialsService } from '../../../../../common/credential.service';

const pathToCredentials = '../../../../../';
const actualCredentials = credentialsService.loadCredentials(pathToCredentials);

export class AbstractPage {
  public static sendQuery(field: ElementFinder, query: string): any {
    field.clear().then(() => {
      field.sendKeys(query);
    });
  }
  public static sendQueryWithoutClear(field: ElementFinder, query: string): any {
    field.sendKeys(query);
  }

  public static logIn(): any {
    AbstractPage.sendQuery(LogInPage.emailField, actualCredentials.get('CMS_E2E_LOGIN_EMAIL'));
    AbstractPage.sendQuery(LogInPage.parolField, actualCredentials.get('CMS_E2E_LOGIN_PASSWORD'));
    LogInPage.loginButton.click(); /*.then(() => {
      LogInPage.buttonToAdminMode.click();
    });*/
  }
}
