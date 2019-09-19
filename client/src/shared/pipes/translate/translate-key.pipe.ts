import { ChangeDetectorRef, Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';
import { LanguageService } from '../../../common';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs/observable/of';
import { Observable } from 'rxjs';

@Pipe({ name: 'translateKey' })
export class TranslateKeyPipe implements PipeTransform {
  BUILT_ENV_PREFIX: string;

  constructor(_ref: ChangeDetectorRef, private languageService: LanguageService) {
    this.BUILT_ENV_PREFIX = `${environment.NODE_ENV.toUpperCase()}_`;
  }

  transform(key: string): Observable<string> {
    const fullKey = this.BUILT_ENV_PREFIX + key.trim();

    const translationOfFullKey$ = this.languageService.getTranslation(fullKey);
    const translationOfKey$ = this.languageService.getTranslation(key);

    return translationOfFullKey$.pipe(switchMap((text: string) => (text ? of(text) : translationOfKey$)));
  }
}
