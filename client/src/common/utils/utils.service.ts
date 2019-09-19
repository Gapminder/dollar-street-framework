import { Injectable } from '@angular/core';
import { ImageResolutionInterface, UrlParameters } from '../../interfaces';
import { reduce, Dictionary } from 'lodash-es';

@Injectable()
export class UtilsService {
  window: Window = window;
  document: Document = document;

  getCoordinates(querySelector: string, cb: any): void {
    let box: any = this.document.querySelector(querySelector).getBoundingClientRect();
    let body: HTMLElement = this.document.body;
    let docEl: HTMLElement = this.document.documentElement;
    let scrollLeft = this.window.pageXOffset || docEl.scrollLeft || body.scrollLeft;
    let clientLeft = docEl.clientLeft || body.clientLeft || 0;
    let top = box.top;
    let left: number = box.left + scrollLeft - clientLeft;

    cb({ top: Math.round(top), left: Math.round(left), width: box.width, height: box.height });
  }

  getImageResolution(isDesktop: boolean): ImageResolutionInterface {
    if (isDesktop) {
      return {
        image: '480x480',
        expand: 'desktops',
        full: 'original'
      };
    }

    if (this.window.innerWidth < 400) {
      return {
        image: '150x150',
        expand: 'devices',
        full: 'tablets'
      };
    }

    return {
      image: 'thumb',
      expand: 'tablets',
      full: 'desktops'
    };
  }

  animateScroll(id: string, inc: number, duration: number, isDesktop: boolean): any {
    if (this.document.body.scrollTop) {
      this.document.body.scrollTop = 0;
    } else {
      this.document.documentElement.scrollTop = 0;
    }
  }

  goToScroll(step: number, duration: number, inc: number): any {
    return () => {
      const currentDuration = duration - inc;

      this.incScrollTop(step);

      if (currentDuration < inc) {
        return;
      }

      window.requestAnimationFrame(this.goToScroll(step, currentDuration, inc));
    };
  }

  incScrollTop(step: number): void {
    if (this.document.body.scrollTop) {
      this.document.body.scrollTop += step;
    } else {
      this.document.documentElement.scrollTop += step;
    }
  }

  parseUrl(url: string): any {
    if (!url || url.indexOf('=') === -1) {
      return {};
    }
    const urlProcessed = url.slice(url.indexOf('?') + 1);

    let params = JSON.parse(`{"${urlProcessed.replace(/&/g, '","').replace(/=/g, '":"')}"}`);
    params = reduce(
      params,
      (result: UrlParameters, value: string, key: string) => {
        result[key] = decodeURI(value);

        return result;
      },
      {}
    );
    if (params.regions) {
      params.regions = params.regions.split(',');
    }

    if (params.countries) {
      params.countries = params.countries.split(',');
    }

    return params;
  }

  objToQuery(data: UrlParameters): string {
    return reduce(
      data as Dictionary<string>,
      (result, value, key) => {
        if (value) {
          result += result.length ? '&' : '';
          result += `${key}=${encodeURI(value.toString())}`;
        }

        return result;
      },
      ''
    );
  }
}
