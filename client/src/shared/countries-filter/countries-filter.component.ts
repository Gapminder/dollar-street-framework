import { fromEvent } from 'rxjs/observable/fromEvent';
import { Subscription } from 'rxjs/Subscription';
import {
  Component,
  OnDestroy,
  OnChanges,
  Output,
  EventEmitter,
  HostListener,
  ElementRef,
  OnInit,
  NgZone,
  ViewChild,
  ChangeDetectorRef
} from '@angular/core';
import {
  chain,
  clone,
  difference,
  union,
  filter,
  get,
  concat,
  find,
  map,
  forEach,
  omit,
  includes,
  reduce
} from 'lodash-es';
import { BrowserDetectionService, LanguageService, UtilsService, UrlChangeService } from '../../common';
import { Store } from '@ngrx/store';
import { AppStates, Continent, CountriesFilterState, Country, LanguageState, UrlParameters } from '../../interfaces';
import * as CountriesFilterActions from './ngrx/countries-filter.actions';
import { KeyCodes } from '../../enums';
import { UrlParametersService } from '../../url-parameters/url-parameters.service';
import { DEBOUNCE_TIME } from '../../defaultState';

@Component({
  selector: 'countries-filter',
  templateUrl: './countries-filter.component.html',
  styleUrls: ['./countries-filter.component.mobile.css', './countries-filter.component.css']
})
export class CountriesFilterComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('underlineK') underlineK: ElementRef;
  @ViewChild('countriesSearch') countriesSearch: ElementRef;
  @ViewChild('countriesMobileSearch') countriesMobileSearch: ElementRef;
  @ViewChild('countriesMobileContainer') countriesMobileContainer: ElementRef;

  @Output()
  isFilterGotData: EventEmitter<string> = new EventEmitter<string>();
  query: string;
  theWorldTranslate: string;
  window: Window = window;
  sliceCount: number;
  activeCountries: string;
  showSelected: boolean;
  locations: Continent[];
  countries: Country[];
  search = '';
  isOpenCountriesFilter = false;
  regionsVisibility = true;
  selectedRegions: string[] = [];
  selectedCountries: string[] = [];
  positionLeft = 0;
  filterTopDistance = 0;
  element: HTMLElement;
  openMobileFilterView = false;
  isDesktop: boolean;
  isTablet: boolean;
  isMobile: boolean;
  isInit: boolean;
  ngSubscriptions: { [key: string]: Subscription } = {};
  filteredSelectedCountries: Country[];
  filteredSelectedRegions: Continent[];
  filterTitle: string;

  constructor(
    elementRef: ElementRef,
    private zone: NgZone,
    private browserDetectionService: BrowserDetectionService,
    private languageService: LanguageService,
    private utilsService: UtilsService,
    private store: Store<AppStates>,
    private urlChangeService: UrlChangeService,
    private changeDetectorRef: ChangeDetectorRef,
    private urlParametersService: UrlParametersService
  ) {
    this.element = elementRef.nativeElement;
  }

  ngOnInit(): void {
    this.isDesktop = this.browserDetectionService.isDesktop();
    this.isMobile = this.browserDetectionService.isMobile();
    this.isTablet = this.browserDetectionService.isTablet();

    this.ngSubscriptions.translation = this.languageService.getTranslation('THE_WORLD').subscribe((trans) => {
      this.theWorldTranslate = trans;

      if (!this.activeCountries) {
        this.activeCountries = this.theWorldTranslate;
      }
    });

    this.ngSubscriptions.countriesFilter = this.store
      .select((appStates: AppStates) => appStates.countriesFilter)
      .debounceTime(DEBOUNCE_TIME)
      .subscribe((countriesFilter: CountriesFilterState) => {
        if (get(countriesFilter, 'countriesFilter', false)) {
          this.locations = countriesFilter.countriesFilter;
          this.countries = chain(this.locations)
            .map('countries')
            .flatten()
            .sortBy('country')
            .value();
          this.isFilterGotData.emit('isCountryFilterReady');
          this.setTitle();
        }
      });

    let currentLanguage = '';
    this.ngSubscriptions.languageStore = this.store
      .select((appState: AppStates) => appState.language)
      .debounceTime(DEBOUNCE_TIME)
      .subscribe((language: LanguageState) => {
        if (currentLanguage !== language.lang) {
          currentLanguage = language.lang;
          const params = this.urlParametersService.getAllParameters();
          this.store.dispatch(new CountriesFilterActions.GetCountriesFilter(this.utilsService.objToQuery(params)));
          this.languageService.getTranslation('THE_WORLD').subscribe((trans: any) => {
            this.theWorldTranslate = trans;
            this.setTitle();
          });
        }
      });

    this.isOpenMobileFilterView();

    this.ngSubscriptions.resize = fromEvent(window, 'resize')
      .debounceTime(DEBOUNCE_TIME)
      .subscribe(() => {
        this.zone.run(() => {
          this.setPosition();
          this.isOpenMobileFilterView();
          this.setTitle();
        });
      });

    this.ngSubscriptions.orientation = fromEvent(window, 'orientationchange')
      .debounceTime(DEBOUNCE_TIME)
      .subscribe(() => {
        this.zone.run(() => {
          this.setTitle();
        });
      });
  }

  ngOnDestroy(): void {
    forEach(this.ngSubscriptions, (value, key) => {
      value.unsubscribe();
    });
  }

  ngOnChanges(changes: any): void {
    this.search = '';

    if (changes.url && changes.url.currentValue) {
      if (!this.isInit) {
        this.isInit = true;

        this.store.dispatch(new CountriesFilterActions.GetCountriesFilter(changes.url.currentValue));
      }

      this.setTitle();
    }
  }

  calcSliceCount(): void {
    this.sliceCount = this.window.innerWidth >= 627 ? 2 : 1;
  }

  @HostListener('document:click', ['$event'])
  isOutsideThingsFilterClick(event: any): void {
    if (!this.element.contains(event.target) && this.isOpenCountriesFilter) {
      this.openCloseCountriesFilter(true);
    }
  }

  hideRegionsIfInFocus(regionsVisibility: boolean): void {
    this.regionsVisibility = !regionsVisibility;
  }

  hideRegions(isShown: boolean): void {
    const tabContent: HTMLElement = this.underlineK.nativeElement;

    if (isShown && tabContent) {
      this.regionsVisibility = false;
      setTimeout(() => {
        if (this.ngSubscriptions.keyUp) {
          this.ngSubscriptions.keyUp.unsubscribe();
        }

        const inputElement: HTMLInputElement = this.countriesMobileSearch.nativeElement;

        this.ngSubscriptions.keyUp = fromEvent(inputElement, 'keyup').subscribe((e: KeyboardEvent) => {
          if (e.keyCode === KeyCodes.enter) {
            this.regionsVisibility = true;
            inputElement.blur();
          }
        });
      }, 0);

      return;
    }

    this.regionsVisibility = true;
  }

  openCloseCountriesFilter(isOpenCountriesFilter: boolean): void {
    this.isOpenCountriesFilter = !isOpenCountriesFilter;
    this.search = '';
    this.regionsVisibility = true;

    this.isShownAllContriesActive();

    const regionsContainerElementList: NodeListOf<HTMLElement> = this.element.querySelectorAll(
      '.countries-container'
    ) as NodeListOf<HTMLElement>;

    if (this.isOpenCountriesFilter) {
      this.utilsService.getCoordinates('things-filter', (data: any) => {
        this.filterTopDistance = data.top;

        setTimeout(() => {
          this.isOpenMobileFilterView();
        }, 0);
      });

      for (let i = 0; i < regionsContainerElementList.length; i++) {
        const regionsContainerElement = regionsContainerElementList[i];

        regionsContainerElement.addEventListener(
          'mousewheel',
          (e) => {
            const whellDir: string = e.wheelDelta < 0 ? 'down' : 'up';

            const deltaHeight: number = regionsContainerElement.scrollHeight - regionsContainerElement.offsetHeight;

            if (whellDir === 'up' && regionsContainerElement.scrollTop === 0) {
              e.preventDefault();
              e.stopPropagation();
            }

            if (whellDir === 'down' && regionsContainerElement.scrollTop >= deltaHeight) {
              e.preventDefault();
              e.stopPropagation();
            }
          },
          false
        );
      }
    }

    if (this.isOpenCountriesFilter && !this.isDesktop) {
      setTimeout(() => {
        const tabContent: HTMLElement = this.countriesMobileContainer.nativeElement;
        const inputElement: HTMLElement = this.countriesMobileSearch.nativeElement;

        if (this.ngSubscriptions.keyUp) {
          this.ngSubscriptions.keyUp.unsubscribe();
        }

        this.ngSubscriptions.keyUp = fromEvent(inputElement, 'keyup').subscribe((e: KeyboardEvent) => {
          if (e.keyCode === KeyCodes.enter) {
            inputElement.blur();
          }
        });

        if (tabContent) {
          tabContent.scrollTop = 0;
        }
      }, 0);
    }

    if (this.isOpenCountriesFilter) {
      this.setPosition();

      setTimeout(() => {
        if (this.isDesktop && !this.openMobileFilterView) {
          this.countriesSearch.nativeElement.focus();
        }

        this.isOpenMobileFilterView();
      }, 0);
    }

    if (!this.isOpenCountriesFilter) {
      this.openMobileFilterView = window.innerWidth < 1024 || !this.isDesktop;
    }
  }

  cancelCountriesFilter(): void {
    this.openCloseCountriesFilter(true);
  }

  clearAllCountries(): void {
    this.showSelected = true;
    this.regionsVisibility = true;
    this.selectedRegions.length = 0;
    this.selectedCountries.length = 0;
    this.search = '';
  }

  selectRegions(location: any): void {
    this.showSelected = false;
    this.search = '';

    let getCountriesNames: string[] = map(location.countries, (country: Country) => {
      return country.empty !== true ? country.originName : undefined;
    });

    getCountriesNames = filter(getCountriesNames, (name: any) => {
      return name !== undefined;
    });

    const indexRegion: number = this.selectedRegions.indexOf(location.originRegionName);

    if (indexRegion !== -1) {
      this.selectedRegions.splice(indexRegion, 1);

      this.selectedCountries = difference(this.selectedCountries, getCountriesNames) as string[];

      this.isShownAllContriesActive();

      return;
    }

    this.selectedRegions.push(location.originRegionName);

    this.selectedCountries = union(this.selectedCountries.concat(getCountriesNames));
    this.isShownAllContriesActive();
  }

  selectCountries(country: Country, originRegionName: string, region: string): void {
    const showSelected = this.showSelected;

    this.showSelected = false;
    this.regionsVisibility = true;

    const indexCountry = this.selectedCountries.indexOf(country.originName);
    const indexRegion = this.selectedRegions.indexOf(originRegionName);

    if (indexCountry === -1 && country.empty) {
      this.showSelected = showSelected;

      return;
    }

    if (indexCountry !== -1) {
      this.selectedCountries.splice(indexCountry, 1);

      if (indexRegion !== -1) {
        this.selectedRegions.splice(indexRegion, 1);
      }

      this.isShownAllContriesActive();

      return;
    }

    this.selectedCountries.push(country.originName);

    const regionObject = find(this.locations, { region: region });

    const filtetredRegionCountries = filter(regionObject.countries, (currentCountry: any) => {
      return currentCountry.empty !== true;
    });

    const regionCountries = map(filtetredRegionCountries, 'originName');

    if (!difference(regionCountries, this.selectedCountries).length) {
      this.selectedRegions.push(originRegionName);
      this.isShownAllContriesActive();
    }
  }
  isShownAllContriesActive() {
    this.showSelected =
      !(this.selectedCountries.length || this.selectedRegions.length) ||
      this.selectedRegions.length === this.locations.length;
  }

  goToLocation(): void {
    this.search = '';
    this.regionsVisibility = true;
    const regions = this.selectedRegions.length ? this.selectedRegions : ['World'];
    const countries = this.selectedCountries.length ? this.selectedCountries : ['World'];
    this.changeDetectorRef.detectChanges();
    this.urlParametersService.dispatchToStore({ regions, countries });
    this.isOpenCountriesFilter = false;
    this.openMobileFilterView = window.innerWidth < 1024 || !this.isDesktop;
    window.scrollTo(0, 0);
  }

  setFilterValueFromQuery() {
    const query: UrlParameters = this.urlParametersService.getAllParameters();

    this.selectedRegions = query.regions[0] === 'World' ? [] : query.regions;
    this.selectedCountries = query.countries[0] === 'World' ? [] : query.countries;
  }

  setTitle() {
    this.setFilterValueFromQuery();
    this.calcSliceCount();

    if (!this.selectedRegions.length && !this.selectedCountries.length) {
      this.filterTitle = this.theWorldTranslate;
      this.store.dispatch(new CountriesFilterActions.CountriesFilterTitle(this.filterTitle));

      return;
    }

    this.filteredSelectedCountries = reduce(
      this.countries,
      (result, country) => {
        if (
          includes(this.selectedCountries, country.originName) &&
          !includes(this.selectedRegions, country.originRegionName)
        ) {
          result.push(country.country);
        }

        return result;
      },
      []
    );

    this.filteredSelectedRegions = reduce(
      this.locations,
      (result, region) => {
        if (includes(this.selectedRegions, region.originRegionName)) {
          result.push(region.region);
        }

        return result;
      },
      []
    );

    this.filterTitle = this.combineTitle(concat(this.filteredSelectedRegions, this.filteredSelectedCountries));

    this.store.dispatch(new CountriesFilterActions.CountriesFilterTitle(this.filterTitle));

    return;
  }

  combineTitle(countries) {
    if (countries.length === 1) {
      return `${countries[0]}`;
    }

    if (countries.length === 2) {
      return this.sliceCount === 1 ? `${countries[0]} (+${countries.length - 1})` : `${countries[0]} & ${countries[1]}`;
    }

    return this.sliceCount === 1
      ? `${countries[0]} (+${countries.length - 1})`
      : `${countries[0]}, ${countries[1]} (+${countries.length - 2})`;
  }

  setPosition(): void {
    this.utilsService.getCoordinates('countries-filter', (data: any) => {
      this.filterTopDistance = data.top;

      if (data.left + 787 + 10 > window.innerWidth) {
        this.positionLeft = data.left + 787 - window.innerWidth + 10;
      } else {
        this.positionLeft = 0;
      }
    });
  }

  isOpenMobileFilterView(): void {
    if (window.innerWidth < 1024 || !this.isDesktop) {
      const pointerContainer = this.element.querySelector('.pointer-container') as HTMLElement;

      const buttonContainer = this.element.querySelector('.button-container') as HTMLElement;

      const shortenWidth = this.element.querySelector('.shorten') as HTMLElement;
      const cancelButton = this.element.querySelector('.cancel') as HTMLElement;
      const okayButton = this.element.querySelector('.okay') as HTMLElement;

      if (okayButton && cancelButton && pointerContainer && shortenWidth) {
        const buttonsContainerWidth = okayButton.offsetWidth + cancelButton.offsetWidth + pointerContainer.offsetWidth;
        if (buttonsContainerWidth && buttonsContainerWidth > buttonContainer.offsetWidth) {
          shortenWidth.classList.add('decreaseFontSize');
          cancelButton.classList.add('decreaseFontSize');
          okayButton.classList.add('decreaseFontSize');
        }
      }
      this.openMobileFilterView = true;

      return;
    }

    const countriesFilterContainer = this.element.querySelector(
      '#countries-filter .countries-filter-container'
    ) as HTMLElement;
    const openCountriesFilterContainer = this.element.querySelector('.open-countries-filter') as HTMLElement;

    this.openMobileFilterView =
      !!countriesFilterContainer &&
      openCountriesFilterContainer &&
      window.innerHeight <
        this.filterTopDistance + countriesFilterContainer.offsetHeight + openCountriesFilterContainer.offsetHeight;
  }
}
