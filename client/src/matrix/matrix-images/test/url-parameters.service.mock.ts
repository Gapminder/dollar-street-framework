import { UrlParameters } from '../../../interfaces';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';


export class UrlParametersServiceMock {
  actionAfterViewLoad = new BehaviorSubject({
    activeHouse: null,
    activeImage: null,
    row: null
  });

  getAllParameters(): UrlParameters {
    return {
      regions: ['World'],
      countries: ['Bangladesh', 'Cambodja', 'Singapour'],
      thing: 'Families'
    };
  }
}
