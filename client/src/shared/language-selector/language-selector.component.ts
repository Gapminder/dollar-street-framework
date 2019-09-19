import { Component, OnInit, ElementRef } from '@angular/core';
import { FontDetectorService, LanguageService } from '../../common';
import { AppStates, LanguageState } from '../../interfaces';
import { Store } from '@ngrx/store';
import { DEBOUNCE_TIME } from '../../defaultState';
import { get, find, filter } from 'lodash-es';
import * as LanguageActions from '../../common/language/ngrx/language.actions';

@Component({
  selector: 'language-selector',
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.css']
})
export class LanguageSelectorComponent implements OnInit {
  disabled = false;
  status: { isOpen: boolean } = { isOpen: false };
  element: HTMLElement;
  window: Window = window;
  currentLanguage: string;
  languages: any[];
  selectedLanguage: any;
  filteredLanguages: any[];

  constructor(
    elementRef: ElementRef,
    private languageService: LanguageService,
    private fontDetectorService: FontDetectorService,
    private store: Store<AppStates>
  ) {
    this.element = elementRef.nativeElement;
  }

  ngOnInit(): void {
    this.store
      .select((store: AppStates) => store.language)
      .debounceTime(DEBOUNCE_TIME)
      .subscribe((state: LanguageState) => {
        this.languages = this.languageService.availableLanguages;
        this.updateLanguages();

        if (this.currentLanguage !== get(state, 'lang', this.currentLanguage)) {
          this.currentLanguage = state.lang;
          this.languageService.changeLanguage(this.currentLanguage);
        }
      });
  }

  updateLanguages(): void {
    if (get(this, 'languages', false)) {
      this.selectedLanguage = find(this.languages, (lang) => lang.code === this.languageService.currentLanguage);

      if (this.selectedLanguage) {
        this.filteredLanguages = filter(this.languages, (lang) => lang.code !== this.selectedLanguage.code);
      } else {
        this.selectedLanguage = find(this.languages, (lang) => lang.code === 'en');
        this.filteredLanguages = filter(this.languages, (lang) => lang.code !== 'en');
      }

      this.fontDetectorService.detectFont();
    }
  }

  changeLanguage(lang: string): void {
    if (this.languageService.currentLanguage === lang) {
      return;
    }

    this.store.dispatch(new LanguageActions.UpdateLanguage(lang));
    this.updateLanguages();
  }
}
