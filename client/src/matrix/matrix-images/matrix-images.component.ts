import 'rxjs/operator/debounceTime';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { fromEvent } from 'rxjs/observable/fromEvent';
import {
  Component,
  Input,
  EventEmitter,
  ElementRef,
  Output,
  AfterViewInit,
  OnDestroy,
  NgZone,
  ViewChild,
  ChangeDetectorRef,
  ViewChildren,
  QueryList,
  AfterViewChecked
} from '@angular/core';
import { Router } from '@angular/router';

import {
  MathService,
  LoaderService,
  LanguageService,
  BrowserDetectionService,
  UtilsService,
  SortPlacesService
} from '../../common';
import { Store } from '@ngrx/store';
import {
  ActionsAfterViewLoad,
  AppStates,
  CountriesFilterState,
  Currency,
  MatrixState,
  ProcessActionsAfterViewLoad,
  StreetSettingsState,
  Country,
  ThingsState
} from '../../interfaces';
import * as MatrixActions from '../../matrix/ngrx/matrix.actions';
import { Place } from '../../interfaces';
import { DEBOUNCE_TIME, DefaultUrlParameters, MAX_PINNED_PLACES } from '../../defaultState';
import { get, forEach, findIndex, map, difference, find, chain, filter } from 'lodash-es';
import { PagePositionService } from '../../shared/page-position/page-position.service';
import { UrlParametersService } from '../../url-parameters/url-parameters.service';
import { MatrixService } from '../matrix.service';
import * as StreetSettingsActions from '../../common';

@Component({
  selector: 'matrix-images',
  templateUrl: './matrix-images.component.html',
  styleUrls: ['./matrix-images.component.css']
})
export class MatrixImagesComponent implements AfterViewInit, AfterViewChecked, OnDestroy {
  @ViewChild('imagesContainer') imagesContainer: ElementRef;

  @ViewChild('imageContent') imageContent: ElementRef;

  @ViewChildren(MatrixImagesComponent) viewChildren: QueryList<MatrixImagesComponent>;

  @Input() thing: string;
  @Input() places: Observable<Place[]>;

  @Output() itemSizeChanged: EventEmitter<any> = new EventEmitter<any>();

  zoom: number;
  showBlock: boolean;
  row: number;
  activeHouse: number;
  query: string;
  theWorldTranslate: string;
  selectedRegions: string[];
  activeCountries: string;
  imageBlockLocation: any;
  indexViewBoxHouse: number;
  positionInRow: number;
  showErrorMsg = false;
  placesArr: any = [];
  isDesktop: boolean;
  currentPlaces: any = [];
  element: HTMLElement;
  placesSubscribe: Subscription;
  itemSize: number;
  familyData: any;
  prevPlaceId: string;
  resizeSubscribe: Subscription;
  windowInnerWidth: number = window.innerWidth;
  visibleImages: number;
  locations: any[];
  getTranslationSubscribe: Subscription;
  appState: Observable<any>;
  isInit: boolean;
  isPinMode = false;
  isEmbederShared: boolean;
  matrixState: Observable<MatrixState>;
  streetState: Observable<StreetSettingsState>;
  matrixStateSubscription: Subscription;
  streetStateSubscription: Subscription;
  placesSet: Place[];
  currencyUnit: Currency;
  streetSetting: StreetSettingsState;
  viewChildrenSubscription: Subscription;
  actionsAfterViewLoad: ProcessActionsAfterViewLoad;
  countries: Country[];
  thingsFilterState: Observable<ThingsState>;
  thingsFilterTitle: string;
  showRegions: string[];
  showCountries: string[];
  selectedCountriesWithoutRegions: string[];

  constructor(
    elementRef: ElementRef,
    private zone: NgZone,
    private router: Router,
    private math: MathService,
    private loaderService: LoaderService,
    private browserDetectionService: BrowserDetectionService,
    private languageService: LanguageService,
    private utilsService: UtilsService,
    private store: Store<AppStates>,
    private changeDetectorRef: ChangeDetectorRef,
    private sortPlacesService: SortPlacesService,
    private pagePositionService: PagePositionService,
    private urlParametersService: UrlParametersService,
    private matrixService: MatrixService
  ) {
    this.element = elementRef.nativeElement;

    this.appState = this.store.select((appStates: AppStates) => appStates.app);
    this.matrixState = this.store.select((appStates: AppStates) => appStates.matrix);
    this.streetState = this.store.select((appStates: AppStates) => appStates.streetSettings);
    this.thingsFilterState = this.store.select((appStates: AppStates) => appStates.thingsFilter);
  }

  ngAfterViewInit() {
    this.isInit = true;

    this.isDesktop = this.browserDetectionService.isDesktop();

    this.getTranslationSubscribe = this.languageService.getTranslation(['THE_WORLD']).subscribe((trans: any) => {
      this.theWorldTranslate = trans.THE_WORLD;
    });

    this.store
      .select((appStates: AppStates) => appStates.countriesFilter)
      .debounceTime(DEBOUNCE_TIME)
      .subscribe((countriesFilter: CountriesFilterState) => {
        if (get(countriesFilter, 'countriesFilterTitle', false)) {
          this.activeCountries = countriesFilter.countriesFilterTitle;
        }
      });

    this.thingsFilterState.subscribe((thing: any) => {
      if (get(thing, 'thingsFilter', false)) {
        this.thingsFilterTitle = thing.thingsFilter.thing.plural;
      }
    });

    this.placesSubscribe = this.places.debounceTime(DEBOUNCE_TIME).subscribe((places: Place[]) => {
      this.showErrorMsg = false;
      this.currentPlaces = places;

      if (this.currentPlaces && !this.currentPlaces.length) {
        this.showErrorMsg = true;
      }
      this.getVisibleRows();
      this.loaderService.setLoader(true);

      if (this.urlParametersService.activeHouseByRoute !== null) {
        const activeHouse = Number(this.urlParametersService.activeHouseByRoute);
        this.toggleImageBlock(this.currentPlaces[activeHouse], activeHouse);
        this.urlParametersService.activeHouseByRoute = null;
      }
      process.nextTick(() => {
        this.calcItemSize();
        this.getVisibleRows();
        let sliceCount: number = this.visibleImages * 2;

        if (this.row && this.row > 1) {
          sliceCount = this.row * this.zoom + this.visibleImages;
        }

        this.placesArr = this.currentPlaces.slice(0, sliceCount);
        this.changeDetectorRef.detectChanges();
      });
    });

    this.viewChildrenSubscription = this.viewChildren.changes
      .debounceTime(DEBOUNCE_TIME)
      .subscribe((event: QueryList<MatrixImagesComponent>) => {
        this.calcItemSize();
      });

    this.matrixStateSubscription = this.matrixState.debounceTime(DEBOUNCE_TIME).subscribe((data: MatrixState) => {
      this.isPinMode = get(data, 'pinMode', false);
      this.isEmbederShared = get(data, 'isEmbederShared', false);
      const newPlacesSet = get(data, 'placesSet', false);

      if (newPlacesSet && data.placesSet !== this.placesSet) {
        this.placesSet = newPlacesSet;
        this.setPinnedPlaces();
      }

      if (get(data, 'currencyUnit', false)) {
        if (this.currencyUnit !== data.currencyUnit) {
          this.currencyUnit = data.currencyUnit;
        }
      }

      this.zoom = get(data, 'zoom', Number(DefaultUrlParameters.zoom));

      if (get(data, 'activeHouseOptions.row', false)) {
        this.row = data.activeHouseOptions.row;
      }

      if (get(data, 'place', false)) {
        if (this.activeHouse !== data.activeHouseOptions.index) {
          this.calcItemSize();
          this.activeHouse = data.activeHouseOptions.index;
          this.row = data.activeHouseOptions.row;
          this.showBlock = !!this.activeHouse;

          process.nextTick(() => {
            // wait render view block, without nextTick page does't have scroll for bottom grid elements doesn't appear view block
            //this.pagePositionService.goToRow(data.activeHouseOptions.row)
          });
        }
      } else {
        this.activeHouse = undefined;
        this.showBlock = false;
      }
    });

    this.streetStateSubscription = this.streetState
      .debounceTime(DEBOUNCE_TIME)
      .subscribe((state: StreetSettingsState) => {
        this.streetSetting = state;
      });

    this.resizeSubscribe = fromEvent(window, 'resize')
      .debounceTime(DEBOUNCE_TIME)
      .subscribe(() => {
        this.zone.run(() => {
          if (this.windowInnerWidth === window.innerWidth) {
            return;
          }

          this.windowInnerWidth = window.innerWidth;
          this.getVisibleRows();
          this.calcItemSize();
        });
      });

    this.urlParametersService.actionAfterViewLoad
      .take(1)
      .debounceTime(DEBOUNCE_TIME)
      .subscribe((actions: ActionsAfterViewLoad) => {
        this.setActionsAfterInit(actions);
      });

    this.changeDetectorRef.detectChanges();
  }

  ngAfterViewChecked(): void {
    if (!this.actionsAfterViewLoad.complete && document.querySelectorAll('.image-content').length) {
      this.processActionAfterViewLoad();
    }
  }

  setActionsAfterInit(actions: ActionsAfterViewLoad): void {
    this.actionsAfterViewLoad = {
      actions,
      complete: false
    };
  }

  processActionAfterViewLoad(): void {
    const images = document.querySelectorAll('.image-content');
    const { row } = this.actionsAfterViewLoad.actions;
    const headerHeight = document.querySelector('.header-container').clientHeight;
    const streetHeight = document.querySelector('.street-container').clientHeight;

    if (row) {
      const zoom = Number(this.urlParametersService.parameters.zoom);
      const index = zoom * row - zoom;
      const imagesTop = images[index].getBoundingClientRect().top;
      const scrollTo =
        imagesTop - headerHeight - streetHeight > 0 && Number(row) !== 1 ? imagesTop - headerHeight - streetHeight : 0;
      const place = images[index];

      if (place) {
        window.scrollTo(0, scrollTo);
      }
    }

    this.actionsAfterViewLoad.complete = true;
  }

  togglePlaceToSet(place: Place): void {
    if (this.isEmbederShared) {
      return;
    }

    this.store
      .select((appStates: AppStates) => appStates.matrix.placesSet)
      .take(1)
      .subscribe((placesSet) => {
        this.togglePlaceInStore(place, placesSet);
      });
  }

  togglePlaceInStore(place, placesSet) {
    if (find(placesSet, { _id: place._id }) || placesSet.length > MAX_PINNED_PLACES) {
      this.store.dispatch(new MatrixActions.RemovePlaceFromSet(place));
      place.pinned = false;

      return;
    }
    this.store.dispatch(new MatrixActions.AddPlaceToSet(place));
  }

  setPinnedPlaces(): void {
    forEach(this.placesSet, (place) => {
      const placeIndex = findIndex(this.placesArr, { _id: place._id });
      if (placeIndex !== -1) {
        this.placesArr[placeIndex].pinned = true;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.getTranslationSubscribe) {
      this.getTranslationSubscribe.unsubscribe();
    }

    if (this.placesSubscribe) {
      this.placesSubscribe.unsubscribe();
    }

    if (this.resizeSubscribe) {
      this.resizeSubscribe.unsubscribe();
    }

    if (this.matrixStateSubscription) {
      this.matrixStateSubscription.unsubscribe();
    }
    if (this.streetStateSubscription) {
      this.streetStateSubscription.unsubscribe();
    }

    if (this.viewChildrenSubscription) {
      this.viewChildrenSubscription.unsubscribe();
    }
  }

  onScrollDown(): void {
    if (this.placesArr.length) {
      const sliceCount =
        this.placesArr.length + this.visibleImages <= this.currentPlaces.length
          ? this.visibleImages
          : this.currentPlaces.length - this.placesArr.length;

      const places = this.currentPlaces.slice(this.placesArr.length, this.placesArr.length + sliceCount);

      this.placesArr = this.placesArr.concat(places);
    }
  }

  changeZoom(prevZoom: number): void {
    setTimeout(() => {
      this.calcItemSize();
      this.getVisibleRows();
      this.onScrollDown();
    }, 0);
  }

  hoverImage(place: any): void {
    if (!this.isDesktop) {
      return;
    }

    if (this.prevPlaceId && place) {
      this.matrixService.setHoverPlaces(place);

      return;
    }

    if (this.prevPlaceId && !place) {
      this.matrixService.setHoverPlaces(this.familyData);

      return;
    }

    this.matrixService.setHoverPlaces(place);

    if (this.isDesktop) {
      return;
    }
  }

  imageIsUploaded(index: number): void {
    this.zone.run(() => {
      this.placesArr[index].isUploaded = true;
    });
  }

  toggleImageBlock(place: Place, index: number) {
    if (!place) {
      return;
    }

    this.familyData = Object.assign({}, place);

    this.indexViewBoxHouse = index;
    this.positionInRow = (this.indexViewBoxHouse + 1) % this.zoom;
    const offset = this.zoom - this.positionInRow;

    this.imageBlockLocation = this.positionInRow ? offset + this.indexViewBoxHouse : this.indexViewBoxHouse;

    if (this.positionInRow === 0) {
      this.positionInRow = this.zoom;
    }

    const row: number = Math.ceil((this.indexViewBoxHouse + 1) / this.zoom);
    const activeHouseIndex: number = this.indexViewBoxHouse + 1;

    if (this.activeHouse === activeHouseIndex) {
      this.store.dispatch(new MatrixActions.UpdateActiveHouse({ row, index: undefined }));
      this.store.dispatch(new MatrixActions.RemovePlace(''));
      this.urlParametersService.removeActiveHouse();
    } else {
      this.store.dispatch(new MatrixActions.SetPlace(place._id));
      this.urlParametersService.setActiveHouse(index);
      this.store.dispatch(new MatrixActions.UpdateActiveHouse({ row, index: activeHouseIndex }));
    }
  }

  closeImageBlock() {
    this.store.dispatch(new MatrixActions.UpdateActiveHouse({ row: this.row, index: null }));
    this.store.dispatch(new MatrixActions.RemovePlace(''));
  }

  toUrl(image: any): string {
    return `url("${image}")`;
  }

  calcItemSize(): void {
    if (!this.imagesContainer || !this.imageContent) {
      return;
    }

    const imageContentElement: HTMLElement = this.imageContent.nativeElement;

    this.itemSize = imageContentElement.offsetWidth;
    this.pagePositionService.itemSize = this.itemSize;
    this.itemSizeChanged.emit(this.itemSize);
    this.checkCurrentRow();
  }

  getVisibleRows(): void {
    if (!this.imagesContainer) {
      return;
    }

    const imagesContainerElement: HTMLElement = this.imagesContainer.nativeElement as HTMLElement;

    const imageHeight: number = imagesContainerElement.offsetWidth / this.zoom;

    let visibleRows: number = Math.round(window.innerHeight / imageHeight);
    if (this.actionsAfterViewLoad.actions.row && this.actionsAfterViewLoad.actions.row > visibleRows) {
      visibleRows = this.actionsAfterViewLoad.actions.row + 1;
    }

    this.visibleImages = this.zoom * visibleRows;
  }

  checkCurrentRow() {
    this.row = this.pagePositionService.currentRow;
  }

  resetIncomeFilter() {
    const setDefaultIncome = {
      lowIncome: this.streetSetting.streetSettings.poor,
      highIncome: this.streetSetting.streetSettings.rich
    };

    this.store.dispatch(new StreetSettingsActions.UpdateStreetFilters(setDefaultIncome));
  }
}
