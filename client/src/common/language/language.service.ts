import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Location } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { environment } from '../../environments/environment';
import { Subscription } from 'rxjs/Subscription';
import { UrlChangeService } from '../url-change/url-change.service';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { find, get } from 'lodash-es';
import { TranslateService } from 'ng2-translate';
import { EventEmitter } from 'events';
import { UtilsService } from '../utils/utils.service';
import * as LanguageActions from './ngrx/language.actions';
import { Store } from '@ngrx/store';
import { AppStates, LanguageState, TranslationsInterface, Language } from '../../interfaces';
import { DEBOUNCE_TIME } from '../../defaultState';

@Injectable()
export class LanguageService {
  window: Window = window;
  currentLanguage: string;
  defaultLanguage = 'en';
  languageName: string;
  translations: any;
  onLangChangeSubscribe: Subscription;
  translationsLoadedSubscribe: Subscription;
  documentLoadedSubscription: Subscription;
  translationsLoadedEvent: EventEmitter = new EventEmitter();
  translationsLoadedString = 'TRANSLATIONS_LOADED';
  languagesList: Observable<any>;
  availableLanguage: string[] = ['en', 'es-ES', 'sv-SE'];
  languageSubscription: Subscription;
  storeLanguage: string;
  availableLanguages: object[];

  public constructor(
    private http: Http,
    private location: Location,
    private urlChangeService: UrlChangeService,
    private translate: TranslateService,
    private localStorageService: LocalStorageService,
    private sanitizer: DomSanitizer,
    private utilsService: UtilsService,
    private store: Store<AppStates>
  ) {
    const languageState = this.store.select((state: AppStates) => state.language);

    this.languageSubscription = languageState.debounceTime(DEBOUNCE_TIME).subscribe((language: LanguageState) => {
      if (get(language, 'lang', false) && this.storeLanguage !== language.lang) {
        this.storeLanguage = language.lang;
        this.setCurrentLanguage(this.availableLanguage);
        this.loadLanguage().subscribe((trans: any) => {
          this.translations = trans;
          this.translationsLoadedEvent.emit(this.translationsLoadedString, trans);
          if (language.translations !== trans) {
            this.store.dispatch(new LanguageActions.UpdateTranslations(trans));
          }
        });
      }
    });

    if (this.documentLoadedSubscription) {
      this.documentLoadedSubscription.unsubscribe();
    }

    this.documentLoadedSubscription = Observable.fromEvent(document, 'DOMContentLoaded').subscribe(() => {
      const htmlElement = document.getElementsByTagName('html')[0];
      const elementAttribute = htmlElement.attributes.getNamedItem('lang');
      elementAttribute.value = this.currentLanguage;
    });

    if (this.onLangChangeSubscribe) {
      this.onLangChangeSubscribe.unsubscribe();
    }

    if (this.translationsLoadedSubscribe) {
      this.translationsLoadedSubscribe.unsubscribe();
    }

    this.translate.setDefaultLang(this.defaultLanguage);
    this.defaultLanguage = this.translate.getDefaultLang();

    this.updateLangInUrl();

    this.onLangChangeSubscribe = this.translate.onLangChange.subscribe((data: any) => {
      this.translations = data.translations;
    });

    this.languagesList = this.getLanguagesList().map((res: any) => {
      if (res.err) {
        console.error(res.err);

        return;
      }

      this.availableLanguages = res.data;

      return res.data;
    });

    this.languagesList.subscribe((data: Language[]) => {
      this.availableLanguage = this.setAvailableLanguages(data);
      this.setCurrentLanguage(this.availableLanguage);
    });
  }

  setAvailableLanguages(data: Language[]): string[] {
    return data.reduce((arr, current) => {
      if (get(current, 'code', false)) {
        arr.push(current.code);
      }

      return arr;
    }, []);
  }

  getLanguageIso(): string {
    let language = '';
    if (this.currentLanguage) {
      if (this.currentLanguage.length === 2) {
        language = `${this.currentLanguage}_ ${this.currentLanguage.toUpperCase()}`;
      } else {
        language = this.currentLanguage.replace(/-/g, '_');
      }
    }

    return language;
  }

  getTranslation(key: string | string[]): Observable<any> {
    return Observable.create((observer: Observer<any>) => {
      if (this.translations) {
        this.processTranslation(observer, this.translations, key);
      } else {
        Observable.fromEvent(this.translationsLoadedEvent, this.translationsLoadedString).subscribe(
          (trans: TranslationsInterface) => {
            this.processTranslation(observer, trans, key);
          }
        );
      }
    });
  }

  loadLanguage(): Observable<any> {
    const lang: string = `lang=${this.currentLanguage}`;

    return Observable.create((observer: Observer<any>) => {
      this.translationsLoadedSubscribe = this.getLanguage(lang).subscribe((res: any) => {
        if (res.err) {
          console.error(res.err);

          return;
        }
        this.translations = res.data;

        this.translate.setTranslation(this.currentLanguage, this.translations);
        this.translate.use(this.currentLanguage);

        observer.next(this.translations);
        observer.complete();
      });
    });
  }

  changeLanguage(lang: string): void {
    this.localStorageService.setItem('language', lang);
  }

  getLanguage(query: string): Observable<any> {
    return this.http.get(`${environment.BASE_HREF}/v1/language?${query}`).map((res: any) => {
      const { error, data } = res.json();

      return { err: error, data };
    });
  }

  getLanguagesList(): Observable<any> {
    return this.http.get(`${environment.BASE_HREF}/v1/languagesList`).map((res: any) => {
      const { error, data } = res.json();
      const currentLanguageObject: any = find(data, { code: this.currentLanguage });

      if (currentLanguageObject) {
        this.languageName = currentLanguageObject.name;
      }

      return { err: error, data };
    });
  }

  getLanguageParam(): string {
    return `&lang=${this.currentLanguage}`;
  }

  private updateLangInUrl(): void {
    const currentUrl: string = this.location.path();

    const pathAndQueryParams: string[] = currentUrl.split('?');
    const queryParamsString: string = pathAndQueryParams[1];
    const queryParams: any = queryParamsString ? this.utilsService.parseUrl(queryParamsString) : {};

    this.currentLanguage = this.currentLanguage ? this.currentLanguage : queryParams.lang;
    queryParams.lang = this.currentLanguage;
  }

  private setCurrentLanguage(languages: string[]): void {
    const found = languages.indexOf(this.storeLanguage) !== -1;

    if (found && this.currentLanguage !== this.storeLanguage) {
      this.currentLanguage = found ? this.storeLanguage : this.defaultLanguage;
    }
  }

  private processTranslation(observer: Observer<any>, translations: any, key: string | string[]): void {
    if (typeof key === 'string') {
      observer.next(translations[key as string]);
    } else if (typeof key === 'object') {
      const obj = {};

      key.forEach((el) => {
        obj[el] = translations[el];
      });

      observer.next(obj);
    }
  }
}
