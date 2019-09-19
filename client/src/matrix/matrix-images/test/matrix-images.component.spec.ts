import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { InfiniteScrollModule } from 'angular2-infinite-scroll';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatrixImagesComponent } from '../matrix-images.component';
import { SortPlacesService } from '../../../common/sort-places/sort-places.service';
import { Place } from '../../../interfaces';
import { CommonServicesTestingModule } from '../../../test/commonServicesTesting.module';
import { MatrixService } from '../../matrix.service';
import { MatrixServiceMock } from '../../../test/mocks/matrixService.service.mock';
import { StoreMock } from '../../ngrx/test/store.mock';
import * as MatrixActions from '../../ngrx/matrix.actions';
import * as StreetSettingsActions from '../../../common';
import { UrlParametersService } from '../../../url-parameters/url-parameters.service';
import { UrlParametersServiceMock } from './url-parameters.service.mock';

describe('MatrixImagesComponent', () => {
  let component: MatrixImagesComponent;
  let fixture: ComponentFixture<MatrixImagesComponent>;
  let store: StoreMock<any>;
  const places: Place[] = [
    {
      background: '',
      country: 'Burundi',
      image: '54afea8f993307fb769cc6f4',
      income: 26.99458113,
      incomeQuality: 10,
      isUploaded: true,
      lat: -3.5,
      lng: 30,
      region: 'Africa',
      showIncome: 27,
      _id: '54afe95c80d862d9767cf32e'
    }
  ];
  const streetSettings = {
    streetSettings: {
      dividers: [],
      filters: { lowIncome: 26, highIncome: 10800 },
      firstLabelName: 'Level 1',
      fourthLabelName: 'Level 4',
      high: 992,
      highDividerCoord: 992,
      low: 62,
      lowDividerCoord: 62,
      medium: 248,
      mediumDividerCoord: 248,
      poor: 26,
      rich: 10800,
      secondLabelName: 'Level 2',
      showCurrency: true,
      showDividers: true,
      showLabels: false,
      thirdLabelName: 'Level 3',
      __v: 0,
      _id: '57963211cc4aaed63a02504c'
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InfiniteScrollModule, RouterTestingModule, CommonServicesTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [MatrixImagesComponent],
      providers: [
        { provide: SortPlacesService, useValue: {} },
        { provide: MatrixService, useClass: MatrixServiceMock },
        { provide: Store, useClass: StoreMock },
        { provide: UrlParametersService, useClass: UrlParametersServiceMock }
      ]
    });

    fixture = TestBed.createComponent(MatrixImagesComponent);
    component = fixture.componentInstance;

    store = TestBed.get(Store);
    store.setState({
      matrix: { placesSet: [] },
      app: {},
      streetSettings: {
        streetSettings: {
          poor: 26,
          rich: 10800
        }
      }
    });

    component.places = Observable.of(places);
  });

  it('ngOnInit()', () => {
    fixture.detectChanges();

    expect(component.getTranslationSubscribe).toBeDefined();
    expect(component.placesSubscribe).toBeDefined();
    expect(component.viewChildrenSubscription).toBeDefined();
    expect(component.matrixStateSubscription).toBeDefined();
    expect(component.streetStateSubscription).toBeDefined();
    expect(component.resizeSubscribe).toBeDefined();

    spyOn(component.getTranslationSubscribe, 'unsubscribe');
    spyOn(component.placesSubscribe, 'unsubscribe');
    spyOn(component.viewChildrenSubscription, 'unsubscribe');
    spyOn(component.matrixStateSubscription, 'unsubscribe');
    spyOn(component.resizeSubscribe, 'unsubscribe');

    component.ngOnDestroy();

    expect(component.getTranslationSubscribe.unsubscribe).toHaveBeenCalled();
    expect(component.placesSubscribe.unsubscribe).toHaveBeenCalled();
    expect(component.viewChildrenSubscription.unsubscribe).toHaveBeenCalled();
    expect(component.matrixStateSubscription.unsubscribe).toHaveBeenCalled();
    expect(component.resizeSubscribe.unsubscribe).toHaveBeenCalled();
  });

  it('check to add the image to comparison and remove if this place already in the state', () => {
    const dispatchSpy = spyOn(store, 'dispatch');

    component.togglePlaceInStore(places[0], []);

    expect(dispatchSpy).toHaveBeenCalledWith(new MatrixActions.AddPlaceToSet(places[0]));

    component.togglePlaceInStore(places[0], places);

    expect(dispatchSpy.calls.argsFor(1)).toEqual([new MatrixActions.RemovePlaceFromSet(places[0])]);
  });

  it('check that function togglePlaceInStore have been call with place and places array from store like arguments', () => {
    const togglePlaceInStoreSpy = spyOn(component, 'togglePlaceInStore');
    store.setState({ matrix: { placesSet: places } });

    component.togglePlaceToSet(places[0]);

    expect(togglePlaceInStoreSpy).toHaveBeenCalledWith(places[0], places);
  });

  it('resetIncomeFilter()', () => {
    const dispatchSpy = spyOn(store, 'dispatch');
    component.streetSetting = streetSettings;
    const setDefaultIncome = {
      lowIncome: streetSettings.streetSettings.poor,
      highIncome: streetSettings.streetSettings.rich
    };

    component.resetIncomeFilter();

    expect(dispatchSpy).toHaveBeenCalledWith(new StreetSettingsActions.UpdateStreetFilters(setDefaultIncome));
  });
});

class MatrixViewBlockComponentMock {
  element = {
    offsetHeight: 0
  };
}
