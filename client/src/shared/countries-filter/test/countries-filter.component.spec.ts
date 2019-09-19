import { async, ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';

import { AppStates } from '../../../interfaces';
import { CountriesFilterComponent } from '../countries-filter.component';
import { CountriesFilterPipe } from '../countries-filter.pipe';

import { UrlParametersService } from '../../../url-parameters/url-parameters.service';
import { CommonServicesTestingModule } from '../../../test/commonServicesTesting.module';
import { forEach } from 'lodash-es';
import { countriesFilterReducer } from '../..';

const countries = [
  {
    empty: false,
    region: 'Asia',
    originRegionName: 'Asia',
    country: 'Bangladesh',
    originName: 'Bangladesh'
  },
  {
    empty: false,
    region: 'Asia',
    originRegionName: 'Asia',
    country: 'Cambodia',
    originName: 'Cambodia'
  },
  {
    empty: true,
    region: 'Africa',
    originRegionName: 'Africa',
    country: 'Egypt',
    originName: 'Egypt'
  }
];

const locations = [
  {
    empty: false,
    region: 'Africa',
    originRegionName: 'Africa',
    countries: [
      {
        empty: true,
        region: 'Africa',
        originRegionName: 'Africa',
        country: 'Egypt',
        originName: 'Egypt'
      }
    ]
  },
  {
    empty: false,
    region: 'Asia',
    originRegionName: 'Asia',
    countries: [
      {
        empty: false,
        region: 'Asia',
        originRegionName: 'Asia',
        country: 'Bangladesh',
        originName: 'Bangladesh'
      },
      {
        empty: false,
        region: 'Asia',
        originRegionName: 'Asia',
        country: 'Cambodia',
        originName: 'Cambodia'
      }
    ]
  }
];
declare const viewport;

describe('CountriesFilterComponent', () => {
  let fixture: ComponentFixture<CountriesFilterComponent>;
  let component: CountriesFilterComponent;
  let store: Store<AppStates>;
  let urlParametersService: UrlParametersService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [CommonServicesTestingModule, StoreModule.forRoot({ countriesFilterReducer })],
      declarations: [CountriesFilterComponent, CountriesFilterPipe]
    });

    fixture = TestBed.createComponent(CountriesFilterComponent);
    component = fixture.componentInstance;
    urlParametersService = TestBed.get(UrlParametersService);
    store = TestBed.get(Store);

    spyOn(store, 'dispatch').and.callThrough();
  }));

  it('ngOnInit(), ngOnDestroy()', () => {
    component.ngOnInit();

    forEach(component.ngSubscriptions, (value, key) => {
      spyOn(value, 'unsubscribe');
    });

    component.ngOnDestroy();

    forEach(component.ngSubscriptions, (value, key) => {
      expect(value.unsubscribe).toHaveBeenCalled();
    });
  });

  it('calcSliceCount()', () => {
    component.calcSliceCount();

    expect(component.sliceCount).toBe(2);
  });

  it('clearAllCountries()', () => {
    component.ngOnInit();

    component.clearAllCountries();

    expect(component.showSelected).toBeTruthy();
    expect(component.regionsVisibility).toBeTruthy();
    expect(component.selectedRegions.length).toBe(0);
    expect(component.selectedCountries.length).toBe(0);
    expect(component.search).toBeFalsy(true);
  });

  it('goToLocation(): should change url parameters', () => {
    component.ngOnInit();
    spyOn(urlParametersService, 'dispatchToStore');
    component.goToLocation();

    expect(urlParametersService.dispatchToStore).toHaveBeenCalledWith({ regions: ['World'], countries: ['World'] });
  });

  it('setTitle()', fakeAsync(() => {
    const selectedCountries = { countries: ['Bangladesh', 'Cambodia', 'Egypt'], regions: ['World'] };
    spyOn(urlParametersService, 'getAllParameters').and.returnValue(selectedCountries);
    component.countries = countries;
    component.locations = locations;
    const expectResult = 'Bangladesh, Cambodia (+1)';

    component.setTitle();

    expect(component.filterTitle).toEqual(expectResult);
  }));
});
