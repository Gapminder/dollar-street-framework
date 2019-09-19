import 'rxjs/add/operator/debounceTime';
import { Subscription } from 'rxjs/Subscription';
import { fromEvent } from 'rxjs/observable/fromEvent';
import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  NgZone,
  ViewChild,
  ViewChildren,
  QueryList,
  ChangeDetectorRef
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppStates, Country, Currency, Place, TimeUnit, UrlParameters } from '../interfaces';
import {
  MathService,
  LoaderService,
  UrlChangeService,
  Angulartics2GoogleTagManager,
  DrawDividersInterface,
  BrowserDetectionService,
  LanguageService,
  IncomeCalcService
} from '../common';
import { MapService } from './map.service';
import { get } from 'lodash-es';
import { UrlParametersService } from '../url-parameters/url-parameters.service';
import { DEBOUNCE_TIME, MOBILE_SIZE } from '../defaultState';
import * as MatrixActions from '../matrix/ngrx/matrix.actions';

@Component({
  selector: 'map-component',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, OnDestroy {
  @ViewChild('mapBox')
  map: ElementRef;
  @ViewChild('hoverPortrait')
  hoverPortrait: ElementRef;
  @ViewChildren('marker')
  markers: QueryList<ElementRef>;
  @ViewChild('mapColor')
  mapColor: ElementRef;
  @ViewChild('infoBoxContainer')
  infoBoxContainer: ElementRef;

  familyTranslate: string;
  places: any[] = [];
  getTranslationSubscribe: Subscription;
  hoverPlace: any = void 0;
  currentCountry: string;
  originCurrentCountry: string;

  resizeSubscribe: Subscription;
  mapServiceSubscribe: Subscription;
  countries: Country[] = [];
  element: any;
  hoverPortraitTop: any;
  hoverPortraitLeft: any;
  thing: any;
  query: string;
  leftSideCountries: any;
  seeAllHomes = false;
  leftArrowTop: any;
  onThumb = false;
  onMarker = false;
  isOpenLeftSide = false;
  isDesktop: boolean;
  isMobile: boolean;
  shadowClass: { shadow_to_left: boolean; shadow_to_right: boolean };
  streetData: DrawDividersInterface;
  currentLanguage: string;
  appStatesSubscribe: Subscription;
  timeUnit: TimeUnit;
  currencyUnit: Currency;

  constructor(
    element: ElementRef,
    private zone: NgZone,
    private router: Router,
    private math: MathService,
    private mapService: MapService,
    private loaderService: LoaderService,
    private activatedRoute: ActivatedRoute,
    private urlChangeService: UrlChangeService,
    private browserDetectionService: BrowserDetectionService,
    private angulartics2GoogleTagManager: Angulartics2GoogleTagManager,
    private languageService: LanguageService,
    private store: Store<AppStates>,
    private incomeCalcService: IncomeCalcService,
    private changeDetectorRef: ChangeDetectorRef,
    private urlParametersService: UrlParametersService
  ) {
    this.element = element.nativeElement;

    this.currentLanguage = this.languageService.currentLanguage;
  }

  ngOnInit(): void {
    this.isDesktop = this.browserDetectionService.isDesktop();
    this.isMobile = this.browserDetectionService.isMobile();

    this.loaderService.setLoader(false);

    this.appStatesSubscribe = this.store.debounceTime(DEBOUNCE_TIME).subscribe((data: AppStates) => {
      // streetSettings
      this.streetData = get(data, 'streetSettings.streetSettings', this.streetData);

      // matrix
      this.timeUnit = get(data.matrix, 'timeUnit', this.timeUnit);
      this.currencyUnit = get(data.matrix, 'currencyUnit', this.currencyUnit);

      // thingsFilter
      const newThing = get(data, 'thingsFilter.thingsFilter.thing.originPlural', null);

      if (newThing !== this.thing) {
        this.thing = newThing;
        const query = `thing=${encodeURI(this.thing)}${this.languageService.getLanguageParam()}`;

        this.mapServiceSubscribe = this.mapService.getMainPlaces(query).subscribe((res) => {
          if (res.err) {
            return;
          }

          this.places = res.data.places;
          this.countries = res.data.countries;

          this.setMarkersCoord(this.places);
          this.loaderService.setLoader(true);

          this.resizeSubscribe = fromEvent(window, 'resize')
            .debounceTime(DEBOUNCE_TIME)
            .subscribe(() => {
              this.zone.run(() => {
                const windowInnerWidth = window.innerWidth;

                if (windowInnerWidth >= MOBILE_SIZE) {
                  document.body.classList.remove('hideScroll');
                }
                this.setMarkersCoord(this.places);
              });
            });
        });
      }

      // app
      this.query = get(data, 'app.query', this.query);
    });

    this.getTranslationSubscribe = this.languageService.getTranslation('FAMILY').subscribe((trans: any) => {
      this.familyTranslate = trans;
    });
  }

  createUrl(): string {
    let currency = '';
    if (this.timeUnit && this.currencyUnit) {
      currency = `&time=${this.timeUnit.code.toLowerCase()}&currency=${this.currencyUnit.code.toLowerCase()}`;
    }

    return `thing=${this.thing}${this.languageService.getLanguageParam()}${currency}`;
  }

  urlChanged(options: { url: string; isNotReplaceState?: boolean }): void {
    const { url, isNotReplaceState } = options;

    this.mapServiceSubscribe = this.mapService.getMainPlaces(url).subscribe((res) => {
      if (res.err) {
        return;
      }

      this.places = res.data.places;
      this.countries = res.data.countries;

      this.query = url;

      if (!isNotReplaceState) {
        this.query = url;
        this.urlChangeService.replaceState('/map', this.createUrl());
      }

      this.setMarkersCoord(this.places);
      this.loaderService.setLoader(true);

      const resizeSubscribe = fromEvent(window, 'resize')
        .debounceTime(DEBOUNCE_TIME)
        .subscribe(() => {
          this.zone.run(() => {
            const windowInnerWidth = window.innerWidth;
            if (windowInnerWidth >= MOBILE_SIZE) {
              document.body.classList.remove('hideScroll');
            }
            this.setMarkersCoord(this.places);
          });
        });
    });
  }

  ngOnDestroy(): void {
    if (this.resizeSubscribe) {
      this.resizeSubscribe.unsubscribe();
    }

    if (this.mapServiceSubscribe) {
      this.mapServiceSubscribe.unsubscribe();
    }

    if (this.getTranslationSubscribe) {
      this.getTranslationSubscribe.unsubscribe();
    }

    if (this.loaderService) {
      this.loaderService.setLoader(false);
    }
  }

  calcHoverPlaceIncome(): void {
    this.calcIncomeValue(this.hoverPlace);
  }

  calcLeftSideIncome(): void {
    this.leftSideCountries = this.leftSideCountries.map((place: Place) => {
      return this.calcIncomeValue(place);
    });
  }

  setMarkersCoord(places: any): void {
    const img = new Image();
    const mapImage: HTMLImageElement = this.mapColor.nativeElement as HTMLImageElement;

    img.onload = () => {
      this.zone.run(() => {
        const width = mapImage.offsetWidth;
        const height = mapImage.offsetHeight;
        const greenwich = width * 0.439;
        const equator = height * 0.545;

        places.forEach((place: any) => {
          const stepTop: number = place.lat > 0 ? equator / 75 : (height - equator) / 75;
          const stepRight: number = place.lng < 0 ? greenwich / 130 : (width - greenwich) / 158;

          place.left = place.lng * stepRight + greenwich;
          place.top = equator - place.lat * stepTop - 23;
        });
      });
    };

    img.src = mapImage.src;
  }

  hoverOnMarker(index: number, country: any, countryOriginName: any): void {
    if (!this.isDesktop) {
      return;
    }

    if (this.isOpenLeftSide) {
      return;
    }

    this.onMarker = true;

    this.originCurrentCountry = countryOriginName;
    this.currentCountry = country;

    this.leftSideCountries = this.places.filter(
      (place: any): boolean => {
        return place.country === this.currentCountry;
      }
    );

    this.calcLeftSideIncome();

    this.seeAllHomes = this.leftSideCountries.length > 1;

    this.places.forEach((place: Place, i: number) => {
      if (i !== index) {
        return;
      }
      this.hoverPlace = place;
      this.calcHoverPlaceIncome();
    });

    if (!this.hoverPlace) {
      return;
    }

    Array.prototype.forEach.call(
      this.markers,
      (markerRef: ElementRef, i: number): void => {
        const marker: HTMLElement = markerRef.nativeElement as HTMLElement;
        if (i === index) {
          return;
        }
        marker.style.opacity = '0.3';
      }
    );

    const img = new Image();

    const portraitBox = this.hoverPortrait.nativeElement as HTMLElement;
    portraitBox.style.opacity = '0';

    img.onload = () => {
      this.zone.run(() => {
        if (!this.hoverPlace) {
          return;
        }

        this.hoverPortraitTop = this.hoverPlace.top - portraitBox.offsetHeight;
        this.hoverPortraitLeft = this.hoverPlace.left - (portraitBox.offsetWidth - 15) / 2;
        this.leftArrowTop = void 0;
        this.shadowClass = { shadow_to_left: true, shadow_to_right: false };

        if (this.hoverPortraitTop < 10) {
          this.hoverPortraitTop = 10;
          this.hoverPortraitLeft += (portraitBox.offsetWidth + 32) / 2;
          this.leftArrowTop = this.hoverPlace.top - 9;

          if (portraitBox.offsetHeight - 12 <= this.leftArrowTop) {
            this.leftArrowTop -= 20;
            this.hoverPortraitTop += 20;
          }

          this.shadowClass = { shadow_to_left: false, shadow_to_right: true };
        }

        if (!this.seeAllHomes) {
          this.shadowClass = { shadow_to_left: false, shadow_to_right: false };
        }

        portraitBox.style.opacity = '1';
      });
    };
    img.src = this.hoverPlace.familyImg.background;
  }

  hoverOnMarkerTablet(index: number, country: any, countryOriginName: any): void {
    if (this.isMobile || this.isDesktop) {
      return;
    }
    if (this.isOpenLeftSide) {
      return;
    }

    this.onMarker = true;
    this.currentCountry = country;
    this.originCurrentCountry = countryOriginName;

    this.leftSideCountries = this.places.filter(
      (place: any): boolean => {
        return place.country === this.currentCountry;
      }
    );

    this.seeAllHomes = this.leftSideCountries.length > 1;

    this.places.forEach((place: any, i: number) => {
      if (i !== index) {
        return;
      }

      this.hoverPlace = place;
    });

    if (!this.hoverPlace) {
      return;
    }

    Array.prototype.forEach.call(
      this.markers,
      (markerRef: ElementRef, i: number): void => {
        const marker: HTMLElement = markerRef.nativeElement as HTMLElement;

        if (i === index) {
          return;
        }

        marker.style.opacity = '0.3';
      }
    );
  }

  unHoverOnMarker(): void {
    if (this.isMobile) {
      return;
    }

    if (this.isOpenLeftSide) {
      return;
    }

    this.onMarker = false;

    setTimeout(() => {
      if (this.onThumb) {
        this.onThumb = !this.onThumb;

        return;
      }

      if (this.onMarker) {
        this.onMarker = !this.onMarker;

        return;
      }

      if (!this.markers) {
        return;
      }

      Array.prototype.forEach.call(
        this.markers,
        (markerRef: ElementRef): void => {
          const marker: HTMLElement = markerRef.nativeElement as HTMLElement;

          marker.style.opacity = '1';
        }
      );

      this.seeAllHomes = false;
      this.hoverPlace = void 0;
      this.hoverPortraitTop = void 0;
      this.hoverPortraitLeft = void 0;
    }, 300);
  }

  openLeftSideBar(): void {
    this.isOpenLeftSide = true;
  }

  closeLeftSideBar(e: MouseEvent | KeyboardEvent): void {
    const infoBoxContainer = this.infoBoxContainer.nativeElement as HTMLElement;
    infoBoxContainer.scrollTop = 0;

    const el = e.target as HTMLElement;

    if (
      el.classList.contains('see-all') ||
      el.classList.contains('see-all-span') ||
      (!this.isDesktop && el.classList.contains('marker'))
    ) {
      this.onMarker = false;
      this.onThumb = false;
      this.seeAllHomes = false;
      this.hoverPlace = void 0;
      this.hoverPortraitTop = void 0;
      this.hoverPortraitLeft = void 0;
      this.unHoverOnMarker();

      return;
    }

    this.isOpenLeftSide = false;
    this.onMarker = false;
    this.onThumb = false;
    const windowInnerWidth = window.innerWidth;

    if (windowInnerWidth < MOBILE_SIZE) {
      document.body.classList.remove('hideScroll');
    }

    if (!el.classList.contains('marker')) {
      this.unHoverOnMarker();
    }
  }

  clickOnMarker(e: MouseEvent, index: number, country: any, countryOriginName: any): void {
    if (this.isOpenLeftSide) {
      this.isOpenLeftSide = !this.isOpenLeftSide;

      this.closeLeftSideBar(e);
      this.hoverOnMarker(index, country, countryOriginName);

      return;
    }

    if (this.leftSideCountries && this.leftSideCountries.length === 1) {
      this.angulartics2GoogleTagManager.eventTrack(
        `Look at ${this.hoverPlace.family} place from ${this.hoverPlace.country} with map page`,
        {}
      );
      this.store.dispatch(new MatrixActions.SetPlace(this.hoverPlace._id));
      this.router.navigate(['/family'], { queryParams: { place: this.hoverPlace._id } });
    }
  }

  mobileClickOnMarker(country: any, countryOriginName: any): void {
    this.currentCountry = country;
    this.originCurrentCountry = countryOriginName;

    this.leftSideCountries = this.places.filter(
      (place: any): boolean => {
        return place.country === this.currentCountry;
      }
    );

    if (this.leftSideCountries && this.leftSideCountries.length) {
      this.openLeftSideBar();
    }
  }

  thumbHover(): void {
    this.onThumb = true;
  }

  toUrl(image: string): string {
    return `url("${image}")`;
  }

  goToPage(params: UrlParameters): void {
    this.urlParametersService.dispatchToStore(params);
  }

  private calcIncomeValue(place: Place): Place {
    if (this.timeUnit && this.currencyUnit) {
      place.showIncome = this.incomeCalcService.calcPlaceIncome(
        place.income,
        this.timeUnit.code,
        this.currencyUnit.value
      );
    } else {
      place.showIncome = this.math.round(place.income);
      this.currencyUnit = {} as Currency;
      this.currencyUnit.symbol = '$';
    }

    return place;
  }
}
