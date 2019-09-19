import { Observable } from 'rxjs/Observable';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { LoaderService, LanguageService, FontDetectorService, GoogleAnalyticsService } from '../common';
import { AppStates, SubscriptionsList } from '../interfaces';
import { forEach } from 'lodash-es';
import { DEBOUNCE_TIME } from '../defaultState';
import { Store } from '@ngrx/store';
import { get } from 'lodash';

declare let ga: Function;

@Component({
  selector: 'consumer-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  isLoader = false;
  isVisibleHeader: boolean;
  isHeaderAndFooterShown = true;
  currentPage: string;
  ngSubscriptions: SubscriptionsList = {};
  hideHeader: boolean;

  constructor(
    private activeRoute: ActivatedRoute,
    private router: Router,
    private languageService: LanguageService,
    private loaderService: LoaderService,
    private fontDetectorService: FontDetectorService,
    private googleAnalyticsService: GoogleAnalyticsService,
    private store: Store<AppStates>
  ) {}

  ngOnInit(): void {
    this.ngSubscriptions.loaderService = this.loaderService
      .getLoaderEvent()
      .subscribe((data: { isLoaded: boolean }) => {
        this.isLoader = data.isLoaded;
      });

    this.ngSubscriptions.matrixState = this.store
      .select((appStates: AppStates) => appStates.matrix)
      .subscribe((matrix) => {
        if (get(matrix, 'pinMode', false) || get(matrix, 'embedMode', false) || get(matrix, 'embedSetId', false)) {
          this.hideHeader = true;

          return;
        }

        this.hideHeader = false;
      });

    this.ngSubscriptions.documentCreated = Observable.fromEvent(document, 'DOMContentLoaded')
      .debounceTime(DEBOUNCE_TIME)
      .subscribe(() => {
        this.fontDetectorService.detectFont();
        this.googleAnalyticsService.googleAnalyticsContent();
      });

    this.ngSubscriptions.routerEvents = this.router.events.subscribe((event: any) => {
      if (event instanceof NavigationEnd) {
        this.currentPage = '';
        const activePage = event.urlAfterRedirects.split('?').shift();

        if (activePage !== '/matrix') {
          document.body.scrollTop = document.documentElement.scrollTop = 0;
        }

        this.isVisibleHeader = !(activePage === '/matrix' || activePage === '/family' || activePage === '/map');

        if (activePage === '/matrix') {
          this.currentPage = 'matrix';
          // TODO remove it if we will use puppeteer for comparison features
          document.body.classList.add(this.currentPage);
        }

        this.isHeaderAndFooterShown = !(activePage === '/preview-twitter-sharing');

        ga('set', 'page', event.urlAfterRedirects);
        ga('send', 'pageview');
      }
    });
  }

  ngOnDestroy(): void {
    forEach(this.ngSubscriptions, (value) => value.unsubscribe());
  }
}
