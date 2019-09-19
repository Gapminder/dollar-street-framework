import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class LoaderService {
  loaderEvents = new Subject<any>();

  setLoader(isLoaded: boolean): void {
    this.loaderEvents.next({ isLoaded });
  }

  getLoaderEvent(): Observable<any> {
    return this.loaderEvents;
  }
}
