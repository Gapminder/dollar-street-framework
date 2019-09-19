import 'rxjs/add/operator/debounceTime';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import {
  OnInit,
  Component,
  OnDestroy,
  Output,
  EventEmitter,
  ElementRef,
  HostListener,
  NgZone,
  ViewChild,
  ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppStates } from '../../interfaces';
import {
  Angulartics2GoogleTagManager,
  BrowserDetectionService,
  UtilsService,
  UrlChangeService,
  LoaderService
} from '../../common';
import { KeyCodes } from '../../enums';
import { UrlParametersService } from '../../url-parameters/url-parameters.service';
import { DEBOUNCE_TIME } from '../../defaultState';
import { orderBy } from 'lodash';

@Component({
  selector: 'things-filter',
  templateUrl: './things-filter.component.html',
  styleUrls: ['./things-filter.component.css', './things-filter.component.mobile.css']
})
export class ThingsFilterComponent implements OnInit, OnDestroy {
  @ViewChild('tabsHeaderContainer') tabsHeaderContainer: ElementRef;
  @ViewChild('tabsContentContainer') tabsContentContainer: ElementRef;
  @ViewChild('thingsSearch') thingsSearch: ElementRef;

  @Output() isFilterGotData: EventEmitter<string> = new EventEmitter<string>();

  query: string;
  relatedThings: any[];
  popularThings: any[];
  otherThings: any[];
  activeThing: any = {};
  search: { text: string } = { text: '' };
  isOpenThingsFilter = false;
  activeColumn = '';
  things: any = [];
  filterTopDistance = 0;
  isDesktop: boolean;
  resizeSubscribe: Subscription;
  openMobileFilterView = false;
  keyUpSubscribe: Subscription;
  element: HTMLElement;
  thingsFilterState: Observable<any>;
  isInit: boolean;
  thingsFilterStateSubscribtion: Subscription;
  appState: Observable<any>;
  appStateSubscription: Subscription;
  thingsFilterTitle: string;
  thingsFilterData: any;

  constructor(
    elementRef: ElementRef,
    private activatedRoute: ActivatedRoute,
    private zone: NgZone,
    private browserDetectionService: BrowserDetectionService,
    private angulartics2GoogleTagManager: Angulartics2GoogleTagManager,
    private utilsService: UtilsService,
    private store: Store<AppStates>,
    private loaderService: LoaderService,
    private changeDetectorRef: ChangeDetectorRef,
    private urlChangeService: UrlChangeService,
    private urlParametersService: UrlParametersService
  ) {
    this.element = elementRef.nativeElement;
    this.appState = this.store.select((appStates: AppStates) => appStates.app);
    this.thingsFilterState = this.store.select((appStates: AppStates) => appStates.thingsFilter);
  }

  @HostListener('document:click', ['$event'])
  isOutsideThingsFilterClick(event: any): void {
    if (!this.element.contains(event.target) && this.isOpenThingsFilter) {
      this.isOpenThingsFilter = false;
      this.search = { text: '' };
    }

    if (this.tabsHeaderContainer && this.tabsContentContainer) {
      if (this.tabsHeaderContainer.nativeElement.clientHeight > 60) {
        this.tabsContentContainer.nativeElement.classList.add('tabs-content-container-two-rows');
      }
    }
  }

  ngOnInit(): void {
    this.isDesktop = this.browserDetectionService.isDesktop();

    this.isOpenMobileFilterView();

    this.appStateSubscription = this.appState.subscribe((data: any) => {
      if (data) {
        if (data.query) {
          if (this.query !== data.query) {
            this.query = data.query;
          }
        }
      }
    });

    this.thingsFilterStateSubscribtion = this.thingsFilterState.subscribe((data: any) => {
      if (data) {
        if (data.thingsFilter) {
          if (this.thingsFilterData !== data.thingsFilter) {
            this.thingsFilterData = data.thingsFilter;
            this.relatedThings = orderBy(this.thingsFilterData.relatedThings, ['plural'], ['asc']);
            this.popularThings = orderBy(this.thingsFilterData.popularThings, ['plural'], ['asc']);
            this.otherThings = orderBy(this.thingsFilterData.otherThings, ['plural'], ['asc']);
            this.activeThing = this.thingsFilterData.thing;

            this.thingsFilterTitle = this.thingsFilterData.thing.plural;

            this.isFilterGotData.emit('isThingFilterReady');

            this.changeDetectorRef.detectChanges();
          }
        }
      }
    });

    this.resizeSubscribe = fromEvent(window, 'resize')
      .debounceTime(DEBOUNCE_TIME)
      .subscribe(() => {
        this.zone.run(() => {
          this.isOpenMobileFilterView();
        });
      });
  }

  ngOnDestroy(): void {
    if (this.keyUpSubscribe) {
      this.keyUpSubscribe.unsubscribe();
    }

    if (this.resizeSubscribe.unsubscribe) {
      this.resizeSubscribe.unsubscribe();
    }

    if (this.thingsFilterStateSubscribtion) {
      this.thingsFilterStateSubscribtion.unsubscribe();
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.unsubscribe();
    }
  }

  openThingsFilter(isOpenThingsFilter: boolean): void {
    this.isOpenThingsFilter = !isOpenThingsFilter;

    const thingsContentElement: HTMLElement = this.element.querySelector('.other-things-content') as HTMLElement;
    const popularContentElement: HTMLElement = this.element.querySelector('.popular-things-content') as HTMLElement;
    const relatedContentElement: HTMLElement = this.element.querySelector('.related-things-content') as HTMLElement;

    this.search = { text: '' };

    if (this.isOpenThingsFilter && !this.isDesktop) {
      this.things = this.relatedThings;
      this.activeColumn = 'related';
    }

    if (this.isOpenThingsFilter) {
      this.utilsService.getCoordinates('things-filter', (data: any) => {
        this.filterTopDistance = data.top;

        setTimeout(() => {
          this.isOpenMobileFilterView();
        }, 0);
      });

      if (thingsContentElement) {
        thingsContentElement.addEventListener(
          'mousewheel',
          (e) => {
            this.scrollFilters(thingsContentElement, e);
          },
          false
        );
      }

      if (popularContentElement) {
        popularContentElement.addEventListener(
          'mousewheel',
          (e) => {
            this.scrollFilters(popularContentElement, e);
          },
          false
        );
      }

      if (relatedContentElement) {
        relatedContentElement.addEventListener(
          'mousewheel',
          (e) => {
            this.scrollFilters(relatedContentElement, e);
          },
          false
        );
      }
    }

    if (!this.isOpenThingsFilter) {
      this.openMobileFilterView = window.innerWidth < 1024 || !this.isDesktop;
    }
  }

  scrollFilters(element: HTMLElement, e: any): void {
    const whellDir: string = e.wheelDelta < 0 ? 'down' : 'up';

    const deltaHeight: number = element.scrollHeight - element.offsetHeight;

    if (whellDir === 'up' && element.scrollTop === 0) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (whellDir === 'down' && element.scrollTop >= deltaHeight) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  goToThing(thingObj: any): void {
    if (thingObj.empty) {
      return;
    }

    const thing = thingObj.originPlural;
    this.isOpenThingsFilter = false;
    this.search = { text: '' };
    this.urlParametersService.dispatchToStore({ thing });
    this.loaderService.setLoader(false);
    this.angulartics2GoogleTagManager.eventTrack(`Matrix page with thing - ${thingObj.originPlural}`, {});
    window.scrollTo(0, 0);
  }

  setActiveThingsColumn(column: string): void {
    this.activeColumn = column;
    this.search = { text: '' };

    switch (column) {
      case 'related':
        this.things = this.relatedThings;
        break;
      case 'popular':
        this.things = this.popularThings;
        break;
      case 'all':
        this.hideKeyboard();

        this.things = this.otherThings;
        break;
      default:
        this.things = this.relatedThings;
    }
    if (this.tabsContentContainer) {
      this.tabsContentContainer.nativeElement.scrollTop = 0;
    }
  }

  hideKeyboard(): void {
    if (this.keyUpSubscribe) {
      this.keyUpSubscribe.unsubscribe();
    }

    const inputElement = this.element.querySelector('.form-control') as HTMLInputElement;

    this.keyUpSubscribe = fromEvent(inputElement, 'keyup').subscribe((e: KeyboardEvent) => {
      if (e.keyCode === KeyCodes.enter) {
        inputElement.blur();
      }
    });
  }

  isOpenMobileFilterView(): void {
    if (window.innerWidth < 1024 || !this.isDesktop) {
      this.openMobileFilterView = true;
      if (this.activeColumn === 'all') {
        return;
      }
      this.setActiveThingsColumn('related');

      return;
    }

    const thingsFilterContainer = this.element.querySelector('#things-filter .things-filter-container') as HTMLElement;
    const thingsFilterButtonContainer = this.element.querySelector(
      '#things-filter .things-filter-button-content'
    ) as HTMLElement;

    if (
      thingsFilterContainer &&
      window.innerHeight <
        this.filterTopDistance + thingsFilterContainer.offsetHeight + thingsFilterButtonContainer.offsetHeight
    ) {
      this.openMobileFilterView = true;
      this.setActiveThingsColumn('related');
    } else {
      this.openMobileFilterView = false;
    }
  }
}
