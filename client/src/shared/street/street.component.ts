import 'rxjs/operator/debounceTime';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { Component, Input, Output, ElementRef, OnDestroy, EventEmitter, ViewChild, AfterViewInit } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  AppStates,
  DrawDividersInterface,
  Place,
  IncomeFilter,
  Currency,
  TimeUnit,
  SubscriptionsList,
  InitStreet,
  TranslationsInterface
} from '../../interfaces';
import { ActivatedRoute } from '@angular/router';
import { get, sortBy, chain, differenceBy, forEach } from 'lodash-es';
import { MathService, LanguageService, BrowserDetectionService } from '../../common';
import { StreetDrawService } from './street.service';
import * as StreetSettingsActions from '../../common';
import { DEBOUNCE_TIME, DefaultUrlParameters } from '../../defaultState';
import { MatrixService } from '../../matrix/matrix.service';

const FREQUENCY_UPDATE_STREET = 10;

@Component({
  selector: 'street',
  templateUrl: './street.component.html',
  styleUrls: ['./street.component.css']
})
export class StreetComponent implements OnDestroy, AfterViewInit {
  @ViewChild('streetBox') streetBox: ElementRef;
  @ViewChild('svg') svg: ElementRef;

  @Input() places: Observable<Place[]>;
  @Input() chosenPlaces: Observable<Place[]>;
  @Input() isWorkSliderOnMobile = false;
  @Input() showLabelAboveStreet = false;

  @Output() filterStreet: EventEmitter<boolean> = new EventEmitter<boolean>();

  window: Window = window;
  street;
  regions;
  thingName;
  countries;
  streetData: DrawDividersInterface;
  element: HTMLElement;
  drawOnMap = false;
  isStreetInit = false;
  placesArr;
  streetBoxContainer: HTMLElement;
  streetBoxContainerMargin: number;
  currencyUnit: Currency;
  timeUnit: TimeUnit;
  ngSubscriptions: SubscriptionsList = {};
  streetFilterSubscribe: Subscription;
  isMobile: boolean;

  constructor(
    elementRef: ElementRef,
    private streetDrawService: StreetDrawService,
    private activatedRoute: ActivatedRoute,
    private math: MathService,
    private languageService: LanguageService,
    private store: Store<AppStates>,
    private matrixService: MatrixService,
    browserDetectionService: BrowserDetectionService
  ) {
    this.element = elementRef.nativeElement;
    this.street = streetDrawService;
    this.isMobile = browserDetectionService.isMobile();
  }

  ngAfterViewInit(): void {
    this.street.setSvg = this.svg.nativeElement;
    this.streetBoxContainer = this.streetBox.nativeElement;
    this.streetFilterSubscribe = this.street.filter.subscribe(this.filterStreet);

    let streetBoxContainerMarginLeft: string = this.window
      .getComputedStyle(this.streetBoxContainer)
      .getPropertyValue('margin-left');

    this.streetBoxContainerMargin = parseFloat(streetBoxContainerMarginLeft) * 2;

    this.street.set('isInit', true);
    this.street.set('chosenPlaces', []);

    this.ngSubscriptions.getTranslation = this.languageService
      .getTranslation(['POOREST', 'RICHEST'])
      .subscribe((trans: TranslationsInterface) => {
        this.street.poorest = trans.POOREST.toUpperCase();
        this.street.richest = trans.RICHEST.toUpperCase();
      });

    this.ngSubscriptions.appStates = this.store.debounceTime(DEBOUNCE_TIME).subscribe((state: AppStates) => {
      const matrix = state.matrix;
      const streetSetting = state.streetSettings;
      const thingsFilter = state.thingsFilter;
      const countryFilter = state.countriesFilter;

      if (this.currencyUnit !== matrix.currencyUnit) {
        this.currencyUnit = matrix.currencyUnit;
        this.street.currencyUnit = this.currencyUnit;
      }

      if (this.streetData !== streetSetting.streetSettings) {
        this.streetData = streetSetting.streetSettings;
      }

      if (this.timeUnit !== matrix.timeUnit) {
        this.timeUnit = matrix.timeUnit;
        this.street.timeUnit = this.timeUnit;
      }

      if (this.placesArr && this.streetData) {
        this.setDividers(this.placesArr, this.streetData);
      }

      const lowIncome = get(streetSetting.streetSettings, 'filters.lowIncome', DefaultUrlParameters.lowIncome);
      const highIncome = get(streetSetting.streetSettings, 'filters.highIncome', DefaultUrlParameters.highIncome);
      this.street.set('lowIncome', lowIncome);
      this.street.set('highIncome', highIncome);

      if (get(thingsFilter.thingsFilter, 'thing', false)) {
        this.thingName = thingsFilter.thingsFilter.thing.originPlural;
      }
      this.countries = countryFilter.selectedCountries;
      this.regions = countryFilter.selectedRegions;

      if (this.currencyUnit && this.countries) {
        this.redrawStreet();
      }
    });

    this.ngSubscriptions.streetFilter = this.street.filter.subscribe(
      (filter: IncomeFilter): void => {
        this.street.set('lowIncome', filter.lowIncome);
        this.street.set('highIncome', filter.highIncome);

        if (
          !this.isStreetInit &&
          filter.lowIncome === this.street.lowIncome &&
          filter.highIncome === this.street.highIncome
        ) {
          this.isStreetInit = true;

          return;
        }
        this.store.dispatch(
          new StreetSettingsActions.UpdateStreetFilters({
            lowIncome: filter.lowIncome,
            highIncome: filter.highIncome
          })
        );
      }
    );

    if (get(this, 'chosenPlaces', false)) {
      this.ngSubscriptions.chosenPlaces = this.chosenPlaces.debounceTime(FREQUENCY_UPDATE_STREET).subscribe(
        (chosenPlaces: Place[]): void => {
          const difference = differenceBy(chosenPlaces, this.street.chosenPlaces, '_id');

          if (this.placesArr && this.streetData) {
            this.setDividers(this.placesArr, this.streetData);
          }

          if (difference.length || chosenPlaces.length !== this.street.chosenPlaces.length) {
            this.street.set('chosenPlaces', chosenPlaces.length ? chosenPlaces : []);

            if (!this.street.scale) {
              return;
            }

            this.street.clearAndRedraw(chosenPlaces);
          }
        }
      );
    }

    this.ngSubscriptions.hoverPlace = this.matrixService.hoverPlace.subscribe(
      (hoverPlace: Place): void => {
        if (this.drawOnMap) {
          this.drawOnMap = !this.drawOnMap;

          return;
        }

        if (!this.street.scale && this.street.isInit) {
          this.street.set('hoverPlace', hoverPlace);

          return;
        }

        if (!hoverPlace) {
          this.street.removeHouses('hover');
          this.street.set('hoverPlace', undefined);
          this.street.clearAndRedraw(this.street.chosenPlaces);

          return;
        }

        this.street.set('hoverPlace', hoverPlace);
        this.street.drawHoverHouse(hoverPlace);
      }
    );

    if (get(this, 'places', false)) {
      this.ngSubscriptions.places = this.places.subscribe(
        (places: Place[]): void => {
          this.placesArr = places;
          if (!this.streetData) {
            return;
          }

          if (!places.length) {
            this.redrawStreet();
          }

          this.setDividers(this.placesArr, this.streetData);
        }
      );
    }

    this.street.filter.next({ lowIncome: this.street.lowIncome, highIncome: this.street.highIncome });

    this.ngSubscriptions.resize = fromEvent(window, 'resize')
      .debounceTime(DEBOUNCE_TIME)
      .subscribe(() => {
        if (!this.street.places) {
          return;
        }

        streetBoxContainerMarginLeft = window.getComputedStyle(this.streetBoxContainer).getPropertyValue('margin-left');
        this.streetBoxContainerMargin = parseFloat(streetBoxContainerMarginLeft) * 2;

        this.setDividers(this.placesArr, this.streetData);
      });
  }

  redrawStreet(): void {
    if (
      this.street.lowIncome &&
      this.street.highIncome &&
      this.streetData &&
      this.regions &&
      this.countries &&
      this.thingName
    ) {
      const streetInitValue: InitStreet = {
        lowIncome: this.street.lowIncome,
        highIncome: this.street.highIncome,
        drawDividers: this.streetData,
        regions: this.regions,
        countries: this.countries,
        thing: this.thingName,
        isWorkSliderOnMobile: this.isWorkSliderOnMobile,
        showLabelAboveStreet: this.showLabelAboveStreet
      };
      this.street
        .clearSvg()
        .init(streetInitValue)
        .set('places', [])
        .set('fullIncomeArr', [])
        .drawScale(this.placesArr, this.streetData, this.element)
        .removeHouses('chosen')
        .removeHouses('hover')
        .removeSliders();
    }
  }

  ngOnDestroy(): void {
    forEach(this.ngSubscriptions, (subscription: Subscription) => {
      subscription.unsubscribe();
    });

    if (this.street) {
      this.street.clearAndRedraw();
      this.street.clearSvg();
    }
  }

  private setDividers(places: Place[], drawDividers: DrawDividersInterface): void {
    if (
      this.street.lowIncome &&
      this.street.highIncome &&
      this.streetData &&
      this.regions &&
      this.countries &&
      this.thingName
    ) {
      const streetInitValue: InitStreet = {
        lowIncome: this.street.lowIncome,
        highIncome: this.street.highIncome,
        drawDividers: this.streetData,
        regions: this.regions,
        countries: this.countries,
        thing: this.thingName,
        isWorkSliderOnMobile: this.isWorkSliderOnMobile,
        showLabelAboveStreet: this.showLabelAboveStreet
      };
      this.street
        .clearSvg()
        .init(streetInitValue)
        .set('places', sortBy(places, 'income'))
        .set(
          'fullIncomeArr',
          chain(this.street.places)
            .sortBy('income')
            .map((place: Place) => {
              if (!place) {
                return void 0;
              }

              return this.street.scale(place.income);
            })
            .compact()
            .value()
        )
        .drawScale(places, drawDividers, this.element);

      if (this.street.chosenPlaces && this.street.chosenPlaces.length) {
        this.street.clearAndRedraw(this.street.chosenPlaces);
      }
    }
  }
}
