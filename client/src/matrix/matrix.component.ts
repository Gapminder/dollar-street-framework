import 'rxjs/add/operator/debounceTime';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Store } from '@ngrx/store';
import { AppStates, Currency, Place, QueryForEmbedInterface, StreetSettingsState, TimeUnit } from '../interfaces';
import {
  Component,
  ElementRef,
  OnDestroy,
  NgZone,
  AfterViewInit,
  ChangeDetectorRef,
  ViewChild,
  EventEmitter,
  Output,
  Input,
  OnChanges
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LocationStrategy } from '@angular/common';
import { cloneDeep, find, map, difference, forEach, get, uniq } from 'lodash';
import {
  LoaderService,
  UrlChangeService,
  Angulartics2GoogleTagManager,
  BrowserDetectionService,
  LanguageService,
  UtilsService,
  DrawDividersInterface,
  MathService,
  SocialShareService,
  SortPlacesService,
  IncomeCalcService,
  LocalStorageService
} from '../common';
import * as MatrixActions from './ngrx/matrix.actions';
import { MatrixImagesComponent } from './matrix-images/matrix-images.component';
import { ImageResolutionInterface } from '../interfaces';
import { MatrixService } from './matrix.service';
import { DEBOUNCE_TIME, DefaultUrlParameters } from '../defaultState';
import { UrlParametersService } from '../url-parameters/url-parameters.service';
import { PagePositionService } from '../shared/page-position/page-position.service';
import { ToastrService } from 'ngx-toastr';
import * as StreetSettingsActions from '../common';

@Component({
  selector: 'matrix',
  templateUrl: './matrix.component.html',
  styleUrls: ['./matrix.component.css']
})
export class MatrixComponent implements OnDestroy, AfterViewInit, OnChanges {
  @ViewChild(MatrixImagesComponent) matrixImagesComponent: MatrixImagesComponent;
  @ViewChild('streetAndTitleContainer') streetAndTitleContainer: ElementRef;
  @ViewChild('streetContainer') streetContainer: ElementRef;
  @ViewChild('matrixHeader') matrixHeader: ElementRef;

  @ViewChild('pinField') pinField: ElementRef;

  @Output() hoverPinnedPlace: EventEmitter<any> = new EventEmitter<any>();

  matrixHeaderElement: HTMLElement;
  streetContainerElement: HTMLElement;
  streetAndTitleContainerElement: HTMLElement;
  zoomPositionFixed: boolean;
  isOpenIncomeFilter = false;
  isMobile: boolean;
  isDesktop: boolean;
  window: Window = window;
  hoverPlace: Subject<any> = new Subject<any>();
  streetPlaces: Subject<any> = new Subject<any>();
  matrixPlaces: Subject<any> = new Subject<any>();
  chosenPlaces: Subject<any> = new Subject<any>();

  @Input() row: number;
  zoom: number;
  lowIncome: number;
  highIncome: number;
  activeHouse: number;

  @Output() itemSize = 0;
  visiblePlaces: number;
  windowInnerWidth: number = window.innerWidth;
  windowInnerHeight: number = window.innerHeight;
  locations: { originRegionName: string }[];
  countriesTranslations: any[];
  streetData: DrawDividersInterface;
  selectedRegions: any;
  activeCountries: any;
  selectedCountries: any;
  placesArr: any[];
  clonePlaces: any[];
  windowHistory: History = history;
  scrollSubscribtion: Subscription;
  resizeSubscribe: Subscription;
  queryParamsSubscribe: Subscription;
  thing = DefaultUrlParameters.thing;
  query: string;
  regions = DefaultUrlParameters.regions[0];
  countries: string;
  element: HTMLElement;
  imageResolution: ImageResolutionInterface;
  matrixImagesContainer: HTMLElement;
  guideContainerElement: HTMLElement;
  device: BrowserDetectionService;
  theWorldTranslate: string;
  getTranslationSubscribe: Subscription;
  streetSettingsState: Observable<StreetSettingsState>;
  appState: Observable<any>;
  matrixState: Observable<any>;
  headerElement: HTMLElement;
  isInit: boolean;
  streetSettingsStateSubscription: Subscription;
  appStateSubscription: Subscription;
  matrixStateSubscription: Subscription;
  isQuickGuideOpened: boolean;
  isPinMode: boolean;
  placesSet: any[];
  showPinTitle: boolean;
  isPreviewView: boolean;
  isEmbedMode: boolean;
  embedSetId: string;
  isEmbedShared: boolean;
  activeThing: any;
  matrixImages: any;
  isScreenshotProcessing: boolean;
  timeUnit: TimeUnit;
  currencyUnit: Currency;
  currencyUnits: Currency[];
  streetPlacesData: Place[];
  timeUnits: TimeUnit[];
  plusSignWidth: number;
  pinPlusCount = 6;
  pinPlusOffset = 16;
  matrixContainerElement: HTMLElement;
  shareUrl: string;
  sharedImageUrl: string;
  downloadImageUrl: string;
  storeSubscription: Subscription;
  embedLink = '';
  showClipboardNotice = false;
  showStreet = false;
  screenshot = null;
  screenshotTool = null;
  placesCountForScreenshot = 2;
  isAllImagesUploaded = false;
  showCreatedEmbed = false;
  isDownloadingImageProgress: boolean;
  translatedThing: string;
  stopComparisonOutput = false;

  constructor(
    element: ElementRef,
    private zone: NgZone,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private locationStrategy: LocationStrategy,
    private loaderService: LoaderService,
    private urlChangeService: UrlChangeService,
    private browserDetectionService: BrowserDetectionService,
    private angulartics2GoogleTagManager: Angulartics2GoogleTagManager,
    private languageService: LanguageService,
    private changeDetectorRef: ChangeDetectorRef,
    private utilsService: UtilsService,
    private store: Store<AppStates>,
    private math: MathService,
    private matrixService: MatrixService,
    private socialShareService: SocialShareService,
    private sortPlacesService: SortPlacesService,
    private incomeCalcService: IncomeCalcService,
    private localStorageService: LocalStorageService,
    private urlParametersService: UrlParametersService,
    private pagePositionService: PagePositionService,
    private toastr: ToastrService
  ) {
    this.element = element.nativeElement;

    this.isMobile = this.browserDetectionService.isMobile();
    this.isDesktop = this.browserDetectionService.isDesktop();

    this.imageResolution = this.utilsService.getImageResolution(this.isDesktop);
  }

  ngAfterViewInit(): void {
    this.headerElement = document.querySelector('.header-content') as HTMLElement;
    this.matrixContainerElement = document.querySelector('.matrix-container') as HTMLElement;

    this.plusSignWidth = this.element.offsetWidth / this.pinPlusCount - this.pinPlusOffset;

    this.matrixImagesContainer = this.matrixImagesComponent.element;
    this.matrixHeaderElement = this.matrixHeader.nativeElement;
    this.streetContainerElement = this.streetContainer.nativeElement;
    this.streetAndTitleContainerElement = this.streetAndTitleContainer.nativeElement;

    this.getTranslationSubscribe = this.languageService.getTranslation(['THE_WORLD']).subscribe((trans: any) => {
      this.theWorldTranslate = trans.THE_WORLD;
    });

    this.storeSubscription = this.store.debounceTime(DEBOUNCE_TIME).subscribe((state: AppStates) => {
      const appState = state.app;
      const matrix = state.matrix;
      const countriesFilter = state.countriesFilter;
      const thingFilter = state.thingsFilter;
      const streetSettings = state.streetSettings;
      if (get(appState, 'query', false) && this.query !== appState.query) {
        this.query = appState.query;
        const parseURL = this.utilsService.parseUrl(this.query);
        this.screenshotTool = parseURL.tool;
        this.screenshot = parseURL.screenshot || this.screenshot;

        if (this.screenshot) {
          this.loaderService.setLoader(true);
        }
      }

      if (get(matrix, 'pinMode', false)) {
        this.isPinMode = true;
        this.isEmbedMode = false;
        this.stopComparisonOutput = false;
      } else {
        this.isPinMode = false;
        this.isEmbedShared = false;
        this.isPreviewView = false;
      }

      this.isEmbedMode = !!get(matrix, 'embedMode', false);

      if (get(matrix, 'matrixImages', false) && this.matrixImages !== matrix.matrixImages) {
        this.matrixImages = matrix.matrixImages;
        this.streetPlacesData = matrix.matrixImages;

        this.processMatrixImages(this.matrixImages);

        if (this.timeUnit) {
          this.changeTimeUnit(this.timeUnit);
        }

        if (this.currencyUnit) {
          this.changeCurrencyUnit(this.currencyUnit);
        }
      }

      this.zoom = Number(get(matrix, 'zoom', DefaultUrlParameters.zoom));

      if (get(matrix, 'timeUnits', false) && this.timeUnits !== matrix.timeUnits) {
        this.timeUnits = matrix.timeUnits;
      }

      if (get(matrix, 'timeUnit', false) && this.timeUnit !== matrix.timeUnit) {
        this.timeUnit = matrix.timeUnit;
        this.changeTimeUnit(matrix.timeUnit);
      }

      if (get(matrix, 'currencyUnits', false) && this.currencyUnits !== matrix.currencyUnits) {
        this.currencyUnits = matrix.currencyUnits;
      }

      if (get(matrix, 'currencyUnit', false) && this.currencyUnit !== matrix.currencyUnit) {
        this.currencyUnit = matrix.currencyUnit;
        this.changeCurrencyUnit(matrix.currencyUnit);
      }

      this.isOpenIncomeFilter = !!get(matrix, 'incomeFilter', false);

      if (get(matrix, 'quickGuide', false)) {
        this.isQuickGuideOpened = true;

        if (!get(matrix.activeHouseOptions, 'index', false) && get(matrix.activeHouseOptions, 'row', 1) === 1) {
          window.scrollTo(0, 0);
        }

        if (get(matrix, 'embedMode', false)) {
          this.store.dispatch(new MatrixActions.OpenQuickGuide(false));
        }
      } else {
        this.isQuickGuideOpened = false;
      }

      if (get(matrix, 'placesSet', false) && this.placesSet !== matrix.placesSet) {
        this.placesSet = matrix.placesSet;
        this.showPinTitle = !(this.placesSet || []).length;
        this.placesCountForScreenshot = (this.placesSet || []).length || this.placesCountForScreenshot;
        if (this.currencyUnit) {
          this.initPlacesSet();
        }
      }

      if (this.query && get(matrix, 'updateMatrix', false)) {
        this.store.dispatch(new MatrixActions.UpdateMatrix(false));
        this.store.dispatch(
          new MatrixActions.GetMatrixImages(`${this.query}&resolution=${this.imageResolution.image}`)
        );
      }

      if (get(countriesFilter, 'countriesFilter', false)) {
        this.processMatrixImages(this.matrixImages);
      }

      if (get(thingFilter, 'thingsFilter', false)) {
        this.activeThing = get(thingFilter.thingsFilter, 'thing', this.activeThing);
        this.thing = get(thingFilter.thingsFilter, 'thing.originPlural', this.thing);
        this.translatedThing = get(thingFilter.thingsFilter, 'thing.plural', this.thing);
      }

      if (get(streetSettings, 'streetSettings', false)) {
        const newLowIncome = get(streetSettings, 'streetSettings.filters.lowIncome');
        const newHighIncome = get(streetSettings, 'streetSettings.filters.highIncome');

        if (this.lowIncome !== newLowIncome || this.highIncome !== newHighIncome) {
          window.scrollTo(0, 0);
        }

        if (this.streetData !== streetSettings.streetSettings) {
          this.streetData = cloneDeep(streetSettings.streetSettings);
          this.processStreetData();
        }

        const poor = get(this.streetData, 'poor', DefaultUrlParameters.lowIncome);
        const rich = get(this.streetData, 'rich', DefaultUrlParameters.highIncome);
        this.lowIncome = +get(this.streetData, 'filters.lowIncome', poor);
        this.highIncome = +get(this.streetData, 'filters.highIncome', rich);

        this.processMatrixImages(this.matrixImages);
      }

      if (get(streetSettings, 'streetSettings', false) && get(thingFilter, 'thingsFilter', false)) {
        this.processMatrixImages(this.matrixImages);
      }

      if (get(matrix, 'embedSetId', false) && this.embedSetId !== matrix.embedSetId) {
        this.embedSetId = matrix.embedSetId;
        const query = this.getQueryPinnedPlaces();

        this.store.dispatch(new MatrixActions.SetEmbedMode(true));
        this.store.dispatch(new MatrixActions.GetPinnedPlaces(query));
        this.showCreatedEmbed = true;
      } else if (!get(matrix, 'placesSet', false)) {
        this.pinModeClose();
      }
      this.changeDetectorRef.detectChanges();
      this.setPinModeContainerSize();
    });

    this.resizeSubscribe = fromEvent(window, 'resize').subscribe(() => {
      this.zone.run(() => {
        if (window.innerWidth === this.windowInnerWidth) {
          return;
        }

        this.windowInnerHeight = window.innerHeight;
        this.windowInnerWidth = window.innerWidth;

        this.plusSignWidth = this.element.offsetWidth / this.pinPlusCount - this.pinPlusOffset;
      });
    });

    if ('scrollRestoration' in history) {
      this.windowHistory.scrollRestoration = 'manual';
    }

    this.scrollSubscribtion = fromEvent(document, 'scroll').subscribe(() => {
      if (!this.itemSize) {
        this.calcItemSize();
      }

      this.processScroll();
      this.setZoomButtonPosition();
      this.getPaddings();
    });
  }

  ngOnChanges(): void {
    this.calcItemSize();
  }

  isPinModeFillUp() {
    return this.isPinMode && !this.isEmbedShared && !this.isScreenshotProcessing;
  }

  initPlacesSet(): void {
    this.placesSet = this.placesSet.map((place: Place) => {
      if (place) {
        place.showIncome = this.incomeCalcService.calcPlaceIncome(
          place.income,
          this.timeUnit.code,
          this.currencyUnit.value
        );

        return place;
      }
    });

    if (!this.isPinMode && this.placesSet.length) {
      this.isEmbedMode = true;
    }
  }

  getQueryPinnedPlaces() {
    const queryFromStore = this.urlParametersService.getQueryPinnedPlace();
    const tool = this.screenshotTool ? `&tool=${this.screenshotTool}` : '';
    const screenshot = this.screenshot ? `&screenshot=${this.screenshot}` : '';

    const query = `${queryFromStore}${tool}${screenshot}`;

    return query;
  }

  onPinnedPlaceHover(place?: Place): void {
    if (!this.isDesktop) {
      return;
    }

    if (!place) {
      this.hoverPinnedPlace.emit(undefined);

      return;
    }

    this.hoverPinnedPlace.emit(place);
  }

  processStreetData(): void {
    if (this.streetData && !this.isInit) {
      this.isInit = true;

      this.lowIncome = this.lowIncome || this.streetData.poor;
      this.highIncome = this.highIncome || this.streetData.rich;

      this.lowIncome = this.lowIncome && this.lowIncome < this.streetData.poor ? this.streetData.poor : this.lowIncome;
      this.highIncome =
        this.highIncome && this.highIncome > this.streetData.rich ? this.streetData.rich : this.highIncome;

      if (this.lowIncome > this.highIncome) {
        this.lowIncome = this.streetData.poor;
      }

      this.zoom = this.zoom || Number(DefaultUrlParameters.zoom);

      if (this.isDesktop && (!this.zoom || this.zoom < 2 || this.zoom > 10)) {
        this.zoom = Number(DefaultUrlParameters.zoom);
      }

      if (!this.isDesktop) {
        this.zoom = 3;
      }
      this.changeDetectorRef.detectChanges();
    }
  }

  changeTimeUnit(timeUnit: TimeUnit): void {
    if (this.placesArr && this.currencyUnit) {
      this.placesArr = this.placesArr.map((place: Place) => {
        if (place) {
          place.showIncome = this.incomeCalcService.calcPlaceIncome(
            place.income,
            timeUnit.code,
            this.currencyUnit.value
          );

          return place;
        }
      });
    }
  }

  changeCurrencyUnit(currencyUnit: any): void {
    if (this.placesArr && this.timeUnit) {
      this.placesArr = this.placesArr.map((place: Place) => {
        if (place) {
          place.showIncome = this.incomeCalcService.calcPlaceIncome(
            place.income,
            this.timeUnit.code,
            currencyUnit.value
          );

          return place;
        }
      });
    }
  }

  openPopUp(target: string): void {
    this.socialShareService.openPopUp(target, this.shareUrl, this.embedSetId);
  }

  clearEmbedMatrix(): void {
    if (this.placesArr) {
      this.placesArr = this.placesArr.map((place: Place) => {
        if (place && place.pinned) {
          place.pinned = false;
        }

        return place;
      });

      this.changeDetectorRef.detectChanges();
    }
  }

  doneAndShare(): void {
    if (this.placesSet && this.placesSet.length > 1) {
      this.isPreviewView = true;
      this.shareEmbed();
    }
  }

  shareEmbed(): void {
    this.isScreenshotProcessing = true;
    this.store.dispatch(new MatrixActions.SetIsEmbededShared(true));
    const places = this.placesSet.map((place) => place._id).join(',');
    const medias = this.placesSet.map((place) => place.image).join(',');
    const thingId = this.activeThing._id;
    const lang = this.languageService.currentLanguage;
    const resolution = '480x480';
    const tool = this.screenshotTool;
    const query: QueryForEmbedInterface = {
      places,
      thingId,
      medias,
      lang,
      resolution
    };

    if (tool) {
      query.tool = tool;
    }
    const queryUrl = map(query, (value, key) => `${key}=${value}`).join('&');

    this.matrixService.savePinnedPlaces(queryUrl).then((res) => {
      if (res.error) {
        this.pinModeClose();
        const title = get(res, 'error.title', '');
        const message = get(res, 'error.message', '');
        this.toastr.error(message, title);

        return;
      }
      // user clicked on close button
      if (this.stopComparisonOutput) {
        return;
      }

      this.isScreenshotProcessing = false;
      const {
        data: {
          embed: { _id },
          embedUrl,
          imageUrl,
          downloadUrl
        }
      } = res;

      this.embedSetId = _id;
      this.shareUrl = embedUrl;
      this.sharedImageUrl = imageUrl;
      this.downloadImageUrl = downloadUrl;

      const queryParams = this.utilsService.parseUrl(this.query);
      queryParams.embed = this.embedSetId;

      this.isEmbedShared = true;

      this.changeDetectorRef.detectChanges();

      this.urlParametersService.dispatchToStore({ embed: this.embedSetId });

      const link = window.location.href.split('?')[0];
      const shareParams = this.urlParametersService.getParamsStringForPage('embed');

      this.embedLink = `${link}?${shareParams}`;

      this.pinField.nativeElement.value = this.shareUrl;
      this.pinField.nativeElement.select();
    });
  }

  downloadImage(): void {
    this.isDownloadingImageProgress = true;
    const url = this.downloadImageUrl;
    const countries = uniq(map(this.placesSet, (place) => place.country));
    const filename = `DollarStreet_${this.thing}_in_${countries}`;
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = () => {
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(xhr.response);
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      this.isDownloadingImageProgress = false;
    };
    xhr.onerror = () => {
      this.isDownloadingImageProgress = false;
      this.toastr.error(`Image not loaded`, `Error`);
    };
    xhr.open('GET', url);
    xhr.send();
  }

  imageIsUploaded(index: number): void {
    this.isAllImagesUploaded = false;
    this.zone.run(() => {
      this.placesSet[index].isUploaded = true;
      this.allImagesIsUploaded();
    });
  }

  allImagesIsUploaded(): void {
    const isUploaded = this.placesSet.filter((image) => image.isUploaded === true);

    if (isUploaded.length === this.placesSet.length) {
      this.isAllImagesUploaded = true;
      this.showStreet = true;
    }
  }

  ngOnDestroy(): void {
    if ('scrollRestoration' in history) {
      this.windowHistory.scrollRestoration = 'auto';
    }

    if (this.storeSubscription) {
      this.storeSubscription.unsubscribe();
    }

    if (this.scrollSubscribtion) {
      this.scrollSubscribtion.unsubscribe();
    }

    if (this.getTranslationSubscribe) {
      this.getTranslationSubscribe.unsubscribe();
    }

    if (this.resizeSubscribe) {
      this.resizeSubscribe.unsubscribe();
    }
    this.loaderService.setLoader(false);
  }

  showAllSelectedThings() {
    this.pinModeClose();
    this.matrixImagesComponent.resetIncomeFilter();
  }

  pinModeClose(openQuickGuide = false): void {
    this.stopComparisonOutput = true;
    this.isEmbedMode = false;
    this.showCreatedEmbed = false;

    this.store.dispatch(new MatrixActions.SetPinMode(false));
    this.store.dispatch(new MatrixActions.SetEmbedMode(false));
    this.store.dispatch(new MatrixActions.SetIsEmbededShared(false));
    this.store.dispatch(new MatrixActions.RemoveEmbededId(''));

    this.embedSetId = undefined;
    this.clearEmbedMatrix();

    if (openQuickGuide) {
      this.localStorageService.removeItem('quick-guide');
      window.scrollTo(0, 0);
      this.store.dispatch(new MatrixActions.OpenQuickGuide(true));
    }
  }

  removePlaceFromSet(e: MouseEvent, place: Place): void {
    e.stopPropagation();

    if (this.placesSet && this.placesSet.length > 0) {
      const currentPlace: any = this.placesArr.find((el) => el._id === place._id);

      currentPlace.pinned = false;

      this.store.dispatch(new MatrixActions.RemovePlaceFromSet(place));
    }
  }

  processScroll(): void {
    this.row = this.pagePositionService.row;

    const clonePlaces = cloneDeep(this.placesArr);

    if (clonePlaces && clonePlaces.length && this.visiblePlaces) {
      this.chosenPlaces.next(clonePlaces.splice((this.row - 1) * this.zoom, this.zoom * this.visiblePlaces));
    }
  }

  getPaddings(): void {
    let matrixHeaderHeight: number = this.matrixHeaderElement.offsetHeight;

    if (this.guideContainerElement) {
      matrixHeaderHeight += this.guideContainerElement.offsetHeight;
    }

    this.getVisibleRows(matrixHeaderHeight);

    if (this.clonePlaces && this.clonePlaces.length) {
      this.chosenPlaces.next(
        this.clonePlaces.splice((this.row - 1) * this.zoom, this.zoom * (this.visiblePlaces || 1))
      );
    }
  }

  getVisibleRows(headerHeight: number): void {
    const viewable = this.windowInnerHeight - headerHeight;

    const distance = viewable / this.itemSize;
    const rest = distance % 1;
    let row = distance - rest;

    if (rest >= 0.85) {
      row++;
    }

    this.visiblePlaces = row;

    this.clonePlaces = cloneDeep(this.placesArr);
  }

  imageHeightChanged(size: number): void {
    if (this.row && !this.activeHouse) {
      this.itemSize = size;

      this.pagePositionService.goToRow(this.row);
    }
  }

  calcItemSize(): void {
    const imageContentElement = this.element.querySelector('.image-content') as HTMLElement;
    const imagesContainerElement = this.element.querySelector('.images-container') as HTMLElement;

    if (!imagesContainerElement || !imageContentElement) {
      return;
    }

    const widthScroll: number = this.windowInnerWidth - document.body.offsetWidth;

    const boxPaddingLeft: string = window.getComputedStyle(imagesContainerElement).getPropertyValue('padding-left');

    const boxContainerPadding: number = parseFloat(boxPaddingLeft) * 2;

    this.itemSize = (imagesContainerElement.offsetWidth - boxContainerPadding - widthScroll) / this.zoom;
  }

  processMatrixImages(data: any): void {
    if (!data || !data.streetPlaces) {
      return;
    }

    this.streetPlacesData = data.streetPlaces;

    if (!this.streetPlacesData.length) {
      this.streetPlaces.next([]);
      this.chosenPlaces.next([]);
      this.matrixPlaces.next([]);

      return;
    }

    const visiblePlaces = this.streetPlacesData.filter(
      (place: Place): boolean => {
        return place && place.income >= this.lowIncome && place.income < this.highIncome;
      }
    );

    this.sortPlacesService.sortPlaces(visiblePlaces, this.zoom).then((sortedPlaces: Place[]) => {
      this.matrixPlaces.next(sortedPlaces);
      this.streetPlaces.next(this.streetPlacesData);

      this.clonePlaces = cloneDeep(sortedPlaces);
      this.chosenPlaces.next(
        this.clonePlaces.splice((this.row - 1) * this.zoom, this.zoom * (this.visiblePlaces || 1))
      );

      this.placesArr = sortedPlaces;

      if (this.currencyUnit) {
        this.changeCurrencyUnit(this.currencyUnit);
      }
      this.changeTimeUnit(this.timeUnit);

      this.buildTitle(this.query);
      this.calcItemSize();
    });

    this.matrixService.setHoverPlaces(undefined);

    this.angulartics2GoogleTagManager.eventTrack(
      `Change filters to thing=${this.thing} countries=${this.selectedCountries} regions=${this.selectedRegions} zoom=${
        this.zoom
      } incomes=${this.lowIncome} - ${this.highIncome}`,
      {}
    );
  }

  activeHouseOptions(options: any): void {
    const { row, activeHouseIndex } = options;

    const queryParams: any = this.utilsService.parseUrl(this.query);

    delete queryParams.activeHouse;

    if (row) {
      queryParams.row = row;
    }

    if (activeHouseIndex) {
      this.activeHouse = activeHouseIndex;
      queryParams.activeHouse = activeHouseIndex;
    } else {
      this.activeHouse = void 0;
    }

    if (!queryParams.lang) {
      queryParams.lang = this.languageService.currentLanguage;
    }

    const url = this.utilsService.objToQuery(queryParams);
  }

  changeZoom(zoom: number): void {
    if (zoom <= 1) {
      return;
    }

    if (!this.isDesktop ? zoom >= 4 : zoom >= 10) {
      return;
    }
    const prevZoom: number = this.zoom;
    this.store.dispatch(new MatrixActions.ChangeZoom(zoom));

    this.calcItemSize();

    this.matrixImagesComponent.changeZoom(prevZoom);

    this.processMatrixImages(this.matrixImages);

    this.changeDetectorRef.detectChanges();
  }

  getResponseFromIncomeFilter(params: any): void {
    if (params.lowIncome && params.highIncome) {
      this.query = this.query
        .replace(/lowIncome\=\d*/, `lowIncome=${params.lowIncome}`)
        .replace(/highIncome\=\d*/, `highIncome=${params.highIncome}`);

      this.lowIncome = params.lowIncome;
      this.highIncome = params.highIncome;
    }

    this.store.dispatch(new MatrixActions.OpenIncomeFilter(false));

    this.processMatrixImages(this.matrixImages);
  }

  scrollTop(e: MouseEvent, element: HTMLElement): void {
    if (this.windowInnerWidth >= 600 || element.className.indexOf('fixed') === -1) {
      return;
    }

    e.preventDefault();

    this.utilsService.animateScroll('scrollBackToTop', 20, 1000, this.isDesktop);
  }

  setZoomButtonPosition(): void {
    if (this.placesArr && this.row && this.zoom) {
      // check is last row appeared in view after scroll
      this.zoomPositionFixed = Math.floor(this.placesArr.length / this.zoom) - 1 <= this.row;

      this.changeDetectorRef.detectChanges();
    }
  }

  findCountryTranslatedName(countries: any[]): any {
    return map(
      countries,
      (item: string): any => {
        const findTransName: any = find(this.countriesTranslations, { originName: item });

        return findTransName ? findTransName.country : item;
      }
    );
  }

  findRegionTranslatedName(regions: any[]): any {
    return map(
      regions,
      (item: string): any => {
        const findTransName: any = find(this.locations, { originRegionName: item });

        return findTransName ? findTransName.region : item;
      }
    );
  }

  buildTitle(url: any): any {
    const query: any = this.utilsService.parseUrl(url);
    const regions: string[] = query.regions;
    const countries: string[] = query.countries;
    let getTranslatedCountries: any;
    let getTranslatedRegions: any;

    if (regions[0] === 'World' && countries[0] === 'World') {
      this.activeCountries = this.theWorldTranslate;

      return;
    }

    if (query.countries[0] !== 'World') {
      getTranslatedCountries = this.findCountryTranslatedName(query.countries);
    }

    if (query.regions[0] !== 'World') {
      getTranslatedRegions = this.findRegionTranslatedName(query.regions);
    }

    if (regions[0] === 'World' && countries[0] !== 'World') {
      if (countries.length > 2) {
        this.activeCountries = `${getTranslatedCountries.slice(0, 2).join(', ')} (+${getTranslatedCountries.length -
          2})`;
      } else {
        this.activeCountries = getTranslatedCountries.join(' & ');
      }

      this.selectedCountries = countries;

      return;
    }

    if (regions[0] !== 'World') {
      if (regions.length > 2) {
        this.activeCountries = `${getTranslatedCountries.slice(0, 2).join(', ')} (+${getTranslatedCountries.length -
          2})`;
      } else {
        let sumCountries = 0;
        let countriesDiff: string[] = [];
        let regionCountries: string[] = [];

        forEach(this.locations, (location: any) => {
          if (regions.indexOf(location.originRegionName) !== -1) {
            regionCountries = regionCountries.concat(map(location.countries, 'country') as string[]);
            sumCountries = +location.countries.length;
          }
        });

        if (sumCountries !== countries.length) {
          countriesDiff = difference(getTranslatedCountries, regionCountries);
        }

        if (countriesDiff.length) {
          this.activeCountries =
            countriesDiff.length === 1 && regions.length === 1
              ? `${getTranslatedRegions[0]} & ${countriesDiff[0]}`
              : `${getTranslatedCountries.slice(0, 2).join(', ')} (+${getTranslatedCountries.length - 2})`;
        } else {
          this.activeCountries = getTranslatedRegions.join(' & ');
        }
      }

      this.selectedRegions = regions;
      this.selectedCountries = countries;

      return;
    }

    const concatLocations: string[] = regions.concat(getTranslatedCountries);

    this.activeCountries =
      concatLocations.length > 2
        ? `${concatLocations.slice(0, 2).join(', ')} (+${concatLocations.length - 2})`
        : (this.activeCountries = concatLocations.join(' & '));

    this.selectedRegions = regions;
    this.selectedCountries = countries;
  }

  setPinModeContainerSize(): void {
    const APP_CONTAINER_PAGGING = 72;
    const container = document.querySelector('.pin-wrap') as HTMLElement;
    const pinContainer = container.querySelector('.pin-container') as HTMLElement;
    const streetContainer = document.querySelector('.street-container') as HTMLElement;
    const streetHeight = streetContainer.offsetHeight;

    const height = pinContainer ? pinContainer.offsetHeight : 0;

    container.style.height = !(this.isEmbedMode || this.showCreatedEmbed || this.isPinMode)
      ? '0'
      : `${(height - streetHeight - APP_CONTAINER_PAGGING).toString()}px`;
    this.changeDetectorRef.detectChanges();
  }

  clipboardSuccess(): void {
    this.showClipboardNotice = true;
    setTimeout(() => {
      this.showClipboardNotice = false;
    }, 2000);
  }
}
