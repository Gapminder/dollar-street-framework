import { Injectable } from '@angular/core';
import { LanguageService } from '../language/language.service';

@Injectable()
export class FontDetectorService {
  currentLanguage: string;
  public fontsSchema: any = [
    { name: 'arabic-script', codes: ['ar'] },
    { name: 'cyrillic-script', codes: ['ru'] },
    { name: 'latin-script', codes: ['en', 'es-ES', 'de', 'pt-BR', 'sv-SE'] },
    { name: 'bosnian-cyrillic', codes: [] },
    { name: 'devanagari', codes: [] },
    { name: 'greek-script', codes: [] },
    { name: 'tamil-script', codes: [] },
    { name: 'chinese-characters', codes: ['zh-CN'] },
    { name: 'telugu-script', codes: [] },
    { name: 'thai-script', codes: [] }
  ];

  public document: Document;

  public constructor(private languageService: LanguageService) {
    this.document = document;
  }

  public detectFont(): void {
    const currentLang: string = this.languageService.currentLanguage;
    if (this.currentLanguage !== currentLang) {
      this.createFontLink(currentLang);
      this.currentLanguage = currentLang;
    }
  }

  createFontLink(currentLang) {
    let style: HTMLElement = this.document.createElement('link') as HTMLElement;
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('type', 'text/css');

    let head: HTMLElement = this.document.getElementsByTagName('head')[0] as HTMLElement;

    let styleDetected: string;

    this.fontsSchema.forEach((font: any) => {
      if (font.codes.indexOf(currentLang) === -1) {
        return;
      }

      styleDetected = './assets/css/' + font.name + '.css';
    });

    let hrefVal: string = styleDetected ? styleDetected : './assets/css/default-fonts.css';

    style.setAttribute('href', hrefVal);

    head.appendChild(style);
  }
}
