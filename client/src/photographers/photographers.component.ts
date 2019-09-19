import { Component, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { Subscription } from 'rxjs/Subscription';
import { MathService, LoaderService, TitleHeaderService, BrowserDetectionService, LanguageService } from '../common';
import { KeyCodes } from '../enums';

import { PhotographersService } from './photographers.service';

@Component({
  selector: 'photographers',
  templateUrl: './photographers.component.html',
  styleUrls: ['./photographers.component.css']
})
export class PhotographersComponent implements OnDestroy, AfterViewInit {
  @ViewChild('photographersSearch')
  photographersSearch: ElementRef;

  search: { text: string } = { text: '' };
  photographersByCountry: any[] = [];
  photographersByName: any[] = [];
  photographersServiceSubscribe: Subscription;
  keyUpSubscribe: Subscription;
  getTranslationSubscribe: Subscription;
  element: HTMLElement;
  isDesktop: boolean;
  defaultPhotographerImage = 'url("./assets/img/empty-photographer.jpg")';

  constructor(
    elementRef: ElementRef,
    private math: MathService,
    private loaderService: LoaderService,
    private titleHeaderService: TitleHeaderService,
    private browserDetectionService: BrowserDetectionService,
    private photographersService: PhotographersService,
    private languageService: LanguageService
  ) {
    this.element = elementRef.nativeElement;
  }

  ngAfterViewInit(): void {
    const searchInput = this.photographersSearch.nativeElement;

    this.keyUpSubscribe = fromEvent(searchInput, 'keyup').subscribe((e: KeyboardEvent) => {
      if (!this.isDesktop && e.keyCode === KeyCodes.enter) {
        searchInput.blur();
      }
    });

    this.isDesktop = this.browserDetectionService.isDesktop();

    this.loaderService.setLoader(false);

    this.getTranslationSubscribe = this.languageService.getTranslation('PHOTOGRAPHERS').subscribe((trans: any) => {
      this.titleHeaderService.setTitle(trans);
    });

    this.photographersServiceSubscribe = this.photographersService
      .getPhotographers(this.languageService.getLanguageParam())
      .subscribe((res: any) => {
        if (res.err) {
          console.error(res.err);

          return;
        }

        this.photographersByCountry = res.data.countryList;
        this.photographersByName = res.data.photographersList;
        this.loaderService.setLoader(true);
      });
  }

  ngOnDestroy(): void {
    this.keyUpSubscribe.unsubscribe();
    this.photographersServiceSubscribe.unsubscribe();
    this.getTranslationSubscribe.unsubscribe();
    this.loaderService.setLoader(false);
  }

  toggleLeftSide(e: Event): void {
    const element = e.target as HTMLElement;
    const parent = element.parentNode as HTMLElement;

    parent.classList.toggle('show');
  }
}
