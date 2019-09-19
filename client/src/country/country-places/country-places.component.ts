import { Component, OnInit, OnDestroy, Input, Output } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { MathService, LoaderService, LanguageService, IncomeCalcService } from '../../common';
import { CountryPlacesService } from './country-places.service';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { AppStates, LanguageState, SubscriptionsList } from '../../interfaces';
import { UrlParametersService } from '../../url-parameters/url-parameters.service';
import * as MatrixActions from '../../matrix/ngrx/matrix.actions';
import * as CountryPlacesActions from './ngrx/country-place.actions';
import { DEBOUNCE_TIME } from '../../defaultState';
import { get, forEach, reduce } from 'lodash-es';

@Component({
  selector: 'country-places',
  templateUrl: './country-places.component.html',
  styleUrls: ['./country-places.component.css']
})
export class CountryPlacesComponent implements OnInit, OnDestroy {
  @Input()
  countryId: string;

  places: any = [];
  country: any;
  math: MathService;
  loaderService: LoaderService;
  countryPlacesService: CountryPlacesService;
  languageService: LanguageService;
  currentLanguage: string;
  matrixStateSubscription: Subscription;
  matrixState: Observable<any>;
  timeUnit: any;
  currencyUnit: any;

  ngSubscriptions: SubscriptionsList = {};

  constructor(
    countryPlacesService: CountryPlacesService,
    loaderService: LoaderService,
    math: MathService,
    languageService: LanguageService,
    private store: Store<AppStates>,
    private incomeCalcService: IncomeCalcService,
    private urlParametersService: UrlParametersService
  ) {
    this.countryPlacesService = countryPlacesService;
    this.math = math;
    this.loaderService = loaderService;
    this.languageService = languageService;

    this.currentLanguage = this.languageService.currentLanguage;
  }

  ngOnInit(): void {
    this.loaderService.setLoader(false);

    const query = `id=${this.countryId}${this.languageService.getLanguageParam()}`;

    this.ngSubscriptions.countryPlacesService = this.countryPlacesService
      .getCountryPlaces(query)
      .subscribe((res: any) => {
        if (res.err) {
          console.error(res.err);

          return;
        }

        this.country = res.data.country;
        this.places = res.data.places;
        this.countryImagesCount(this.places);

        this.calcPlacesIncome();

        this.loaderService.setLoader(true);
      });

    this.ngSubscriptions.matrixState = this.store
      .select((appStates: AppStates) => appStates.matrix)
      .debounceTime(DEBOUNCE_TIME)
      .subscribe((data: any) => {
        if (data) {
          this.timeUnit = get(data, 'timeUnit', this.timeUnit);
          this.currencyUnit = get(data, 'currencyUnit', this.currencyUnit);
        }
      });

    this.ngSubscriptions.languageState = this.store
      .select((appState: AppStates) => appState.language)
      .debounceTime(DEBOUNCE_TIME)
      .subscribe((language: LanguageState) => {
        if (language.lang !== this.currentLanguage) {
          this.currentLanguage = language.lang;
        }
      });
  }

  ngOnDestroy(): void {
    this.loaderService.setLoader(false);

    forEach(this.ngSubscriptions, (subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

  calcPlacesIncome(): void {
    this.places = this.places.map((place) => {
      if (this.timeUnit && this.currencyUnit) {
        place.showIncome = this.incomeCalcService.calcPlaceIncome(
          place.income,
          this.timeUnit.code,
          this.currencyUnit.value
        );
      } else {
        place.showIncome = this.math.round(place.income);
        this.currencyUnit = {};
        this.currencyUnit.symbol = '$';
      }

      return place;
    });
  }

  goToPage(params) {
    this.urlParametersService.dispatchToStore(params);
  }

  visitThisHome(placeId: string): void {
    this.store.dispatch(new MatrixActions.SetPlace(placeId));
  }

  countryImagesCount(places) {
    const count = reduce(
      places,
      (sum, value) => {
        return sum + value.imagesCount;
      },
      0
    );

    this.store.dispatch(new CountryPlacesActions.CountryImagesCount(count));
  }
}
