import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { MathService, LoaderService, LanguageService } from '../../common';
import { PhotographerPlacesService } from './photographer-places.service';
import * as MatrixActions from '../../matrix/ngrx/matrix.actions';
import { Store } from '@ngrx/store';
import { AppStates } from '../../interfaces';

@Component({
  selector: 'photographer-places',
  templateUrl: './photographer-places.component.html',
  styleUrls: ['./photographer-places.component.css']
})
export class PhotographerPlacesComponent implements OnInit, OnDestroy {
  @Input() photographerId: string;
  places: any = [];
  photographerPlacesServiceSubscribe: Subscription;
  currentLanguage: string;

  constructor(
    private math: MathService,
    private store: Store<AppStates>,
    private loaderService: LoaderService,
    private photographerPlacesService: PhotographerPlacesService,
    private languageService: LanguageService
  ) {
    this.currentLanguage = this.languageService.currentLanguage;
  }

  ngOnInit(): void {
    this.loaderService.setLoader(false);

    this.photographerPlacesServiceSubscribe = this.photographerPlacesService
      .getPhotographerPlaces(`id=${this.photographerId}${this.languageService.getLanguageParam()}`)
      .subscribe((res: any) => {
        if (res.err) {
          console.error(res.err);

          return;
        }

        this.places = res.data.places;
        this.loaderService.setLoader(true);
      });
  }

  ngOnDestroy(): void {
    this.photographerPlacesServiceSubscribe.unsubscribe();
    this.loaderService.setLoader(false);
  }

  visitThisHome(placeId: string): void {
    this.store.dispatch(new MatrixActions.SetPlace(placeId));
  }
}
