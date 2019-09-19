import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { LanguageService } from '../language/language.service';
import { environment } from '../../environments/environment';

@Injectable()
export class SocialShareService {
  url: string;
  location: Location;
  window: Window = window;
  newWindow: Window;
  document: Document = document;
  documentCreatedSubscribe: Subscription;
  sharesTitleTranslated: string;
  shareMessageTranslated: string;
  twitterShareMessageTranslated: string;
  getTranslationSubscribe: Subscription;

  constructor(private languageService: LanguageService, private http: Http) {
    this.documentCreatedSubscribe = Observable.fromEvent(document, 'DOMContentLoaded').subscribe(() => {
      this.location = location;
    });

    this.getTranslationSubscribe = this.languageService
      .getTranslation(['PHOTOS_AS_DATA', 'LIVES_ON_DOLLAR_STREET', 'LIVES_ON_DOLLAR_STREET_TWITTER'])
      .subscribe((trans: any) => {
        this.sharesTitleTranslated = trans.PHOTOS_AS_DATA;
        this.shareMessageTranslated = trans.LIVES_ON_DOLLAR_STREET;
        this.twitterShareMessageTranslated = trans.LIVES_ON_DOLLAR_STREET_TWITTER;
      });
  }

  async openPopUp(target: string, url: string = null, embed?: string): Promise<void> {
    this.openWindow();
    const { protocol, host } = this.location;
    const twitterUrl = `${protocol}//${host}${environment.BASE_HREF}/preview-twitter-sharing`; // TODO need here absolute path because of running under gapminder.org nginx
    const facebookUrl = 'http://www.facebook.com/sharer.php';
    const linkedinUrl = 'https://www.linkedin.com/shareArticle';
    const sharedUrl = url ? url : this.location.pathname + this.location.search;
    const { url: shortenedUrl } = await this.getShortUrl({ url: sharedUrl });
    const params: URLSearchParams = new URLSearchParams();
    let originalUrl = '';

    switch (target) {
      case 'twitter':
        originalUrl = twitterUrl;
        params.set('url', shortenedUrl);
        params.set('embed', embed);
        break;

      case 'facebook':
        originalUrl = facebookUrl;
        params.set('u', shortenedUrl);
        params.set('title', this.sharesTitleTranslated);
        params.set('description', this.shareMessageTranslated);
        break;

      case 'linkedin':
        originalUrl = linkedinUrl;
        params.set('mini', 'true');
        params.set('url', shortenedUrl);
        params.set('title', this.sharesTitleTranslated);
        params.set('summary', this.shareMessageTranslated);
        break;

      default:
        console.error('Incorrect sharing option');
    }

    this.url = params.toString();

    this.redirectWindow(originalUrl, this.url);
  }

  openWindow(): void {
    const popupWidth = 490;
    const leftPositionPopup: number = (this.window.innerWidth - popupWidth) / 2;
    this.newWindow = this.window.open(
      '',
      '_blank',
      `width=${popupWidth}, height=560, top=100, left=${leftPositionPopup}`
    );
  }

  redirectWindow(originalUrl: string, url: string): void {
    this.newWindow.location.href = `${originalUrl}?${url}`;
    this.newWindow.focus();
  }

  private getShortUrl(query: { url: string }): Promise<{ err: string; url: string }> {
    return this.http
      .post(`${environment.BASE_HREF}/v1/shorturl`, query)
      .map((res: any) => {
        const parseRes = JSON.parse(res._body);

        return { err: parseRes.error, url: parseRes.data };
      })
      .toPromise();
  }
}
