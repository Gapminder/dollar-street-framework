import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { AboutComponent } from '../about.component';
import { CommonServicesTestingModule } from '../../test/commonServicesTesting.module';
import { LanguageServiceMock } from '../../test/mocks/language.service.mock';
import { LanguageService } from '../../common/language/language.service';
import { LoaderService } from '../../common/loader/loader.service';
import { LoaderServiceMock } from '../../test/mocks/loader.service.mock';
import { HtmlSanitizerPipe } from '../../shared/pipes/sanitize-pipe/sanitize-html.pipe';
import { StoreModule } from '@ngrx/store';

class ActivatedRouteAboutMock {
  queryParams = new BehaviorSubject({ jump: 'info-context' });
}

describe('AboutComponent', () => {
  let component: AboutComponent;
  let fixture: ComponentFixture<AboutComponent>;
  let languageService: LanguageServiceMock;
  let loaderService: LoaderServiceMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CommonServicesTestingModule,
        StoreModule.forRoot({})
      ],
      declarations: [AboutComponent, HtmlSanitizerPipe],
      providers: [
        { provide: ActivatedRoute, useClass: ActivatedRouteAboutMock }
      ]
    });

    fixture = TestBed.createComponent(AboutComponent);
    languageService = TestBed.get(LanguageService);
    loaderService = TestBed.get(LoaderService);

    component = fixture.componentInstance;
  });

  it('check subscriptions on init', () => {
    component.ngAfterViewInit();
    component.ngOnInit();

    expect(component.languageSubscription).toBeDefined();
    expect(component.getTranslationSubscription).toBeDefined();
    expect(component.queryParamsSubscription).toBeDefined();
  });

  it('unsubscribe on destroy', () => {
    component.ngAfterViewInit();
    component.ngOnInit();

    spyOn(component.languageSubscription, 'unsubscribe');
    spyOn(component.getTranslationSubscription, 'unsubscribe');
    spyOn(component.queryParamsSubscription, 'unsubscribe');

    component.ngOnDestroy();

    expect(component.languageSubscription.unsubscribe).toHaveBeenCalledWith();
    expect(component.queryParamsSubscription.unsubscribe).toHaveBeenCalledWith();
    expect(component.queryParamsSubscription.unsubscribe).toHaveBeenCalledWith();
  });

  it('set loader on init', () => {
    spyOn(loaderService, 'setLoader');
    component.ngAfterViewInit();
    component.ngOnInit();

    expect(loaderService.setLoader).toHaveBeenCalledWith(false);
  });

  it('should scroll to element from queryParams', () => {
    spyOn(window, 'scrollTo');

    fixture.detectChanges();
    component.ngAfterViewInit();

    expect(window.scrollTo).toHaveBeenCalled();
  });
});

