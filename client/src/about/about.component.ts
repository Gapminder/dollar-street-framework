import { Subscription } from 'rxjs/Subscription';
import { Component, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoaderService, TitleHeaderService, LanguageService } from '../common';
import { AppStates, LanguageState } from '../interfaces';
import { Store } from '@ngrx/store';
import { DEBOUNCE_TIME } from '../defaultState';

@Component({
  selector: 'about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit, AfterViewInit, OnDestroy {
  getTranslationSubscription: Subscription;
  queryParamsSubscription: Subscription;
  jumpToSelector: string;
  languageSubscription: Subscription;

  constructor(
    private loaderService: LoaderService,
    private titleHeaderService: TitleHeaderService,
    private languageService: LanguageService,
    private activatedRoute: ActivatedRoute,
    private store: Store<AppStates>
  ) {}

  ngOnInit() {
    const languageState = this.store.select('language');

    this.languageSubscription = languageState.debounceTime(DEBOUNCE_TIME).subscribe((language: LanguageState) => {
      this.addClassToParentIframes();
    });
  }

  ngAfterViewInit(): void {
    this.loaderService.setLoader(false);

    this.getTranslationSubscription = this.languageService.getTranslation('ABOUT').subscribe((trans: any) => {
      this.loaderService.setLoader(true);
      this.titleHeaderService.setTitle(trans);
    });

    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe((params: any) => {
      const jumpSelector = decodeURI(params.jump);

      if (jumpSelector !== 'undefined') {
        this.jumpToSelector = jumpSelector;
      }

      const targetEl = document.getElementById(this.jumpToSelector);

      if (targetEl) {
        targetEl.scrollIntoView();
        window.scrollTo(0, window.scrollY - 80);
      }
    });
  }

  addClassToParentIframes() {
    const iframes: HTMLElement[] = [].slice.call(document.getElementsByTagName('iframe'));

    iframes.forEach((item) => {
      item.parentElement.classList.add('iframe-wrapper');
    });
  }

  ngOnDestroy(): void {
    if (this.getTranslationSubscription) {
      this.getTranslationSubscription.unsubscribe();
    }

    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }

    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }

    this.loaderService.setLoader(false);
  }
}
