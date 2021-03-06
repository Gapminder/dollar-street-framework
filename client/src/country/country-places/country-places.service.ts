import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { environment } from '../../environments/environment';

import 'rxjs/add/operator/map';

@Injectable()
export class CountryPlacesService {
  constructor(private http: Http) {}

  getCountryPlaces(query: any): Observable<any> {
    return this.http.get(`${environment.BASE_HREF}/v1/country-places?${query}`).map((res: any) => {
      const parseRes = JSON.parse(res._body);

      return { err: parseRes.error, data: parseRes.data };
    });
  }
}
