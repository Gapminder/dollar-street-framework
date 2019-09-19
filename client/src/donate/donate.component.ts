import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs/Subscription';
import { LoaderService, TitleHeaderService, LanguageService, BrowserDetectionService, UtilsService } from '../common';
import { DonateService } from './donate.service';

@Component({
  selector: 'donate',
  templateUrl: './donate.component.html',
  styleUrls: ['./donate.component.css']
})
export class DonateComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('donateValue') donateValue: ElementRef;
  @ViewChild('aboutDialog') aboutDialog: ElementRef;

  getTranslationSubscribe: Subscription;
  document: Document = document;
  window: Window = window;
  siteName = 'Dollar Street - photos as data to kill country stereotypes';
  siteDescription: string =
    'Imagine the world as a street. Everyone lives on Dollar Street. The richest ' +
    'to the left and the poorest to the right. Every else live somewhere in between. Where would you live? ' +
    'Visit Dollar Street and see homes from hundreds of homes from all over the World.';
  isShowAboutData: boolean;
  isShowAboutDataFullScreen: boolean;
  maxHeightPopUp: number;
  aboutDataPosition: any = {};
  elementTagName = 'script';
  scriptAdded = false;
  addAmountTrans: string;
  element: HTMLElement;

  constructor(
    private loaderService: LoaderService,
    private donateService: DonateService,
    private titleHeaderService: TitleHeaderService,
    private languageService: LanguageService,
    private utilsService: UtilsService,
    private browserDetectionService: BrowserDetectionService,
    private sanitizer: DomSanitizer,
    private elementRef: ElementRef
  ) {
    this.element = this.elementRef.nativeElement;
  }

  ngOnInit(): void {
    this.loaderService.setLoader(true);

    this.getTranslationSubscribe = this.languageService
      .getTranslation(['HOW_CAN_HELP', 'ADD_AMOUNT'])
      .subscribe((trans: any) => {
        this.titleHeaderService.setTitle(trans.HOW_CAN_HELP);
        this.addAmountTrans = trans.ADD_AMOUNT;
      });
  }

  ngOnDestroy(): void {
    this.loaderService.setLoader(false);
    this.getTranslationSubscribe.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.addStripeScript();
  }

  showAboutPopUp(): void {
    const aboutDataContainer = this.aboutDialog.nativeElement as HTMLElement;

    this.utilsService.getCoordinates('.container', (data: any) => {
      this.aboutDataPosition.left = data.left - aboutDataContainer.clientWidth + 28;
      this.aboutDataPosition.top = data.top + 28;

      this.aboutDataPosition.windowHeight = this.window.innerHeight - 60;
      this.aboutDataPosition.windowWidth = this.browserDetectionService.isMobile() ? this.window.innerWidth - 20 : 380;

      this.isShowAboutData = true;
      this.isShowAboutDataFullScreen = true;
    });
  }

  addStripeScript(): void {
    if (this.scriptAdded) {
      return;
    }

    this.scriptAdded = true;

    const fjs: HTMLElement = this.document.getElementsByTagName(this.elementTagName)[0] as HTMLElement;

    const js: HTMLElement = this.document.createElement(this.elementTagName) as HTMLElement;
    js.setAttribute('src', 'https://checkout.stripe.com/checkout.js');

    fjs.parentNode.insertBefore(js, fjs);
  }

  closeAboutPopUp(event: MouseEvent | KeyboardEvent): void {
    const el = event && (event.target as HTMLElement);
    const isEscapeEvent = event instanceof KeyboardEvent && event.key === 'Escape';

    if (el.className.indexOf('closeMenu') !== -1 || isEscapeEvent) {
      this.isShowAboutData = false;
      this.isShowAboutDataFullScreen = false;
    }
  }

  purchaseClicked(value: number | string): void {
    if (!value) {
      value = this.donateValue.nativeElement.value;

      if (!value) {
        return;
      }
    }

    this.donateService.showStripeDialog(
      {
        name: this.siteName,
        description: this.siteDescription,
        amount: Number(value) * 100
      },
      this.showAboutPopUp.bind(this)
    );
  }
}
