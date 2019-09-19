import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { Component, OnInit, OnDestroy, Input, EventEmitter, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  AppStates,
  StreetSettingsState,
  DrawDividersInterface,
  Thing,
  UrlParameters,
  LanguageState
} from '../../interfaces';
import { MathService, LanguageService, BrowserDetectionService, UrlChangeService, UtilsService } from '../../common';
import { CountryInfoService } from './country-info.service';
import { get } from 'lodash-es';
import * as AppActions from '../../app/ngrx/app.actions';
import * as ThingsFilterActions from '../../shared/things-filter/ngrx/things-filter.actions';
import * as MatrixActions from '../../matrix/ngrx/matrix.actions';
import * as CountriesFilterActions from '../../shared/countries-filter/ngrx/countries-filter.actions';
import { StreetDrawService } from '../../shared/street/street.service';
import { UrlParametersService } from '../../url-parameters/url-parameters.service';
import { PagePositionService } from '../../shared/page-position/page-position.service';
import { DEBOUNCE_TIME } from '../../defaultState';

@Component({
  selector: 'country-info',
  templateUrl: './country-info.component.html',
  styleUrls: ['./country-info.component.css']
})
export class CountryInfoComponent implements OnInit, OnDestroy {
  @Input()
  countryId: string;
  @Output()
  getCountry: EventEmitter<any> = new EventEmitter<any>();

  mapData;
  isShowInfo: boolean;
  country;
  thing: Thing;
  placesQuantity: string;
  photosQuantity: number;
  videosQuantity: string;
  math: MathService;
  countryInfoService: CountryInfoService;
  countryInfoServiceSubscribe: Subscription;
  streetData: DrawDividersInterface;
  languageService: LanguageService;
  device: BrowserDetectionService;
  streetSettingsState: Observable<StreetSettingsState>;
  streetSettingsStateSubscription: Subscription;
  getTranslationSubscribe: Subscription;
  countryPlacesImageTotalCountSubscription: Subscription;

  constructor(
    countryInfoService: CountryInfoService,
    math: MathService,
    languageService: LanguageService,
    browserDetectionService: BrowserDetectionService,
    private store: Store<AppStates>,
    private streetService: StreetDrawService,
    private urlChangeService: UrlChangeService,
    private urlParametersService: UrlParametersService,
    private utilsService: UtilsService,
    private pagePositionService: PagePositionService
  ) {
    this.device = browserDetectionService;
    this.countryInfoService = countryInfoService;
    this.math = math;
    this.isShowInfo = false;
    this.languageService = languageService;

    this.streetSettingsState = this.store.select((appStates: AppStates) => appStates.streetSettings);
  }

  ngOnInit(): void {
    this.streetSettingsStateSubscription = this.streetSettingsState.subscribe((data: StreetSettingsState) => {
      if (get(data, 'streetSettings', false)) {
        this.streetData = data.streetSettings;
      }
    });

    const languageState = this.store.select('language');
    const countryPlacesState = this.store.select((appStates: AppStates) => appStates.countryPlaces);

    this.getTranslationSubscribe = languageState.debounceTime(DEBOUNCE_TIME).subscribe((language: LanguageState) => {
      this.getCountryInfoData();
    });

    this.countryPlacesImageTotalCountSubscription = countryPlacesState
      .debounceTime(DEBOUNCE_TIME)
      .subscribe((countryPlaces) => {
        this.photosQuantity = countryPlaces.CountryImagesCount;
      });
  }

  getCountryInfoData() {
    this.countryInfoServiceSubscribe = this.countryInfoService
      .getCountryInfo(`id=${this.countryId}${this.languageService.getLanguageParam()}`)
      .subscribe((res) => {
        if (get(res, 'err', false)) {
          return;
        }
        this.country = res.data.country;
        this.mapData = res.data.country;
        this.thing = res.data.thing;
        this.placesQuantity =
          this.device.isMobile() !== true
            ? Math.round(res.data.places).toString()
            : Math.round(res.data.places)
                .toString()
                .replace(/\s+/g, '');
        this.videosQuantity = Math.round(res.data.video) > 0 ? Math.round(res.data.video).toString() : '';
        this.getCountry.emit(this.country.alias || this.country.country);
      });
  }

  ngOnDestroy(): void {
    if (this.countryInfoServiceSubscribe) {
      this.countryInfoServiceSubscribe.unsubscribe();
    }
    if (this.getTranslationSubscribe) {
      this.getTranslationSubscribe.unsubscribe();
    }
    if (this.streetSettingsStateSubscription) {
      this.streetSettingsStateSubscription.unsubscribe();
    }
    if (this.countryPlacesImageTotalCountSubscription) {
      this.countryPlacesImageTotalCountSubscription.unsubscribe();
    }
  }

  goToMatrixByCountry(country: string): void {
    const queryParams: UrlParameters = this.urlParametersService.getAllParameters();

    queryParams.regions = ['World'];
    queryParams.countries = [country];
    queryParams.lowIncome = this.streetData.poor.toString();
    queryParams.highIncome = this.streetData.rich.toString();

    delete queryParams.activeHouse;

    const queryUrl: string = this.utilsService.objToQuery(queryParams);

    this.store.dispatch(new AppActions.SetQuery(queryUrl));

    this.store.dispatch(new ThingsFilterActions.GetThingsFilter(queryUrl));

    this.store.dispatch(new CountriesFilterActions.GetCountriesFilter(queryUrl));
    this.store.dispatch(new CountriesFilterActions.SetSelectedCountries(queryParams.countries));
    this.store.dispatch(new CountriesFilterActions.SetSelectedRegions(queryParams.regions));

    this.store.dispatch(new MatrixActions.RemovePlace({}));

    this.store.dispatch(new MatrixActions.UpdateMatrix(true));
    this.streetService.clearAndRedraw();

    this.urlChangeService.assignState('/matrix');

    this.pagePositionService.scrollTopZero();
  }
}
