'use strict';
import { $, ElementFinder } from 'protractor';

export class LogInPage {
  public static emailField:ElementFinder = $('input[ng-model*="email"]');
  public static parolField:ElementFinder = $('input[ng-model*="password"]');
  public static loginButton:ElementFinder = $('.btn.btn-primary.block.full-width.m-b');

}
