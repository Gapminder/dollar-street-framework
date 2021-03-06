import { Observable } from 'rxjs';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { reducers } from './ngrx/root.reducer';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app.routing';
import { MatrixModule } from '../matrix/matrix.module';
import { SharedModule, ThingsFilterEffects, CountriesFilterEffects } from '../shared';
import { CommonAppModule, StreetSettingsEffects } from '../common';
import { Angulartics2Module, Angulartics2GoogleTagManager } from 'angulartics2';
import { TranslateModule, TranslateLoader } from 'ng2-translate';
import { UrlParametersComponent } from '../url-parameters/url-parameters.component';
import { UrlParametersService } from '../url-parameters/url-parameters.service';
import { PagePositionComponent } from '../shared/page-position/page-position.component';
import { PagePositionService } from '../shared/page-position/page-position.service';

export class CustomLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return Observable.of({ KEY: 'value' });
  }
}

@NgModule({
  declarations: [AppComponent, UrlParametersComponent, PagePositionComponent],
  providers: [UrlParametersService, PagePositionService],
  imports: [
    BrowserModule,
    HttpModule,
    HttpClientModule,
    FormsModule,
    CommonAppModule,
    AppRoutingModule,
    SharedModule,
    MatrixModule,
    StoreModule.forRoot(reducers),
    EffectsModule.forRoot([StreetSettingsEffects, ThingsFilterEffects, CountriesFilterEffects]),
    TranslateModule.forRoot({ provide: TranslateLoader, useClass: CustomLoader }),
    Angulartics2Module.forRoot([Angulartics2GoogleTagManager])
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
