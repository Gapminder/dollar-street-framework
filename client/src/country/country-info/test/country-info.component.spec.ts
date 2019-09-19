import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable } from 'rxjs/Observable';
import { Angulartics2Module, Angulartics2 } from 'angulartics2';
import { TranslateModule, TranslateService, TranslateLoader, TranslateParser } from 'ng2-translate';
import {
  MathService,
  LanguageService,
  BrowserDetectionService,
  Angulartics2GoogleTagManager,
  TitleHeaderService
} from '../../../common';
import { Store, StoreModule } from '@ngrx/store';
import {
  LanguageServiceMock,
  BrowserDetectionServiceMock,
  Angulartics2GoogleAnalyticsMock,
  AngularticsMock,
  TranslateServiceMock,
  TranslateLoaderMock,
  TranslateParserMock,
  TitleHeaderServiceMock,
  StoreMock
} from '../../../test/';
import { RegionMapComponent } from '../../../shared/region-map/region-map.component';
import { CountryInfoComponent } from '../country-info.component';
import { CountryInfoService } from '../country-info.service';
import { CommonServicesTestingModule } from '../../../test/commonServicesTesting.module';
import { StreetDrawService } from '../../../shared/street/street.service';
import { StreetDrawServiceMock } from '../../../test/mocks/streetDrawService.mock';
import { TranslateKeyPipe } from '../../../shared/pipes/translate/translate-key.pipe';

describe('CountryInfoComponent', () => {
  let fixture: ComponentFixture<CountryInfoComponent>;
  let component: CountryInfoComponent;
  let titleHeaderService: TitleHeaderServiceMock;
  let countryInfoService: CountryInfoServiceMock;
  let store: StoreMock;

  const countryInfo = {
    success: true,
    msg: [],
    data: {
      country: {
        _id: '55ef338d0d2b3c82037884eb',
        code: 'PK',
        region: 'Asia',
        country: 'Pakistan',
        lat: 30,
        lng: 70,
        alias: 'Pakistan',
        originName: 'Pakistan'
      },
      places: 1,
      images: 174,
      thing: 'Families'
    },
    error: null
  };

  class CountryInfoServiceMock {
    public getCountryInfo(): Observable<any> {
      return Observable.of(countryInfo);
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({}),
        RouterTestingModule,
        Angulartics2Module,
        TranslateModule,
        CommonServicesTestingModule
      ],
      declarations: [CountryInfoComponent, RegionMapComponent, TranslateKeyPipe],
      providers: [
        MathService,
        { provide: TranslateService, useClass: TranslateServiceMock },
        { provide: TranslateLoader, useClass: TranslateLoaderMock },
        { provide: TranslateParser, useClass: TranslateParserMock },
        { provide: Angulartics2, useClass: AngularticsMock },
        { provide: BrowserDetectionService, useClass: BrowserDetectionServiceMock },
        { provide: LanguageService, useClass: LanguageServiceMock },
        { provide: CountryInfoService, useClass: CountryInfoServiceMock },
        { provide: Angulartics2GoogleTagManager, useClass: Angulartics2GoogleAnalyticsMock },
        { provide: StreetDrawService, useValue: StreetDrawServiceMock },
        { provide: TitleHeaderService, useClass: TitleHeaderServiceMock },
        { provide: Store, useClass: StoreMock }
      ]
    });

    fixture = TestBed.createComponent(CountryInfoComponent);
    component = fixture.componentInstance;
    titleHeaderService = TestBed.get(TitleHeaderService);
    countryInfoService = TestBed.get(CountryInfoService);
    store = TestBed.get(Store);
  }));

  it('ngOnInit(), ngOnDestroy()', () => {
    component.ngOnInit();

    expect(component.getTranslationSubscribe).toBeDefined();
    expect(component.countryInfoServiceSubscribe).toBeDefined();
    expect(component.streetSettingsStateSubscription).toBeDefined();
    expect(component.countryPlacesImageTotalCountSubscription).toBeDefined();

    spyOn(component.getTranslationSubscribe, 'unsubscribe');
    spyOn(component.countryInfoServiceSubscribe, 'unsubscribe');
    spyOn(component.streetSettingsStateSubscription, 'unsubscribe');
    spyOn(component.countryPlacesImageTotalCountSubscription, 'unsubscribe');

    component.ngOnDestroy();

    expect(component.getTranslationSubscribe.unsubscribe).toHaveBeenCalled();
    expect(component.countryInfoServiceSubscribe.unsubscribe).toHaveBeenCalled();
    expect(component.streetSettingsStateSubscription.unsubscribe).toHaveBeenCalled();
    expect(component.countryPlacesImageTotalCountSubscription.unsubscribe).toHaveBeenCalled();
  });
});
