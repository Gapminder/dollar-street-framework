import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { TitleHeaderService } from '../common';

@Component({
  selector: 'photographer',
  templateUrl: './photographer.component.html',
  styleUrls: ['./photographer.component.css']
})
export class PhotographerComponent implements OnInit, OnDestroy {
  photographerId: string;
  activatedRoute: ActivatedRoute;
  queryParamsSubscribe: Subscription;
  titleHeaderService: TitleHeaderService;

  constructor(activatedRoute: ActivatedRoute, titleHeaderService: TitleHeaderService) {
    this.activatedRoute = activatedRoute;
    this.titleHeaderService = titleHeaderService;
  }

  ngOnInit(): void {
    this.queryParamsSubscribe = this.activatedRoute.params.subscribe((params: any) => {
      this.photographerId = params.id;
    });
  }

  ngOnDestroy(): void {
    this.queryParamsSubscribe.unsubscribe();
  }

  setTitle(title: string): void {
    this.titleHeaderService.setTitle(title);
  }
}
