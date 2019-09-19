import { Component, Input, OnInit, OnDestroy, ElementRef, NgZone, ViewChild } from '@angular/core';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { Subscription } from 'rxjs/Subscription';
import { find } from 'lodash-es';
import { LocalStorageService, BrowserDetectionService, UtilsService } from '../../../common';
import { KeyCodes } from '../../../enums';
import { DEBOUNCE_TIME } from '../../../defaultState';
import * as MatrixActions from '../../../matrix/ngrx/matrix.actions';
import { Store } from '@ngrx/store';
import { AppStates } from '../../../interfaces';

@Component({
  selector: 'bubble',
  templateUrl: './bubble.component.html',
  styleUrls: ['./bubble.component.css']
})
export class BubbleComponent implements OnInit, OnDestroy {
  @ViewChild('bubblesContainer') bubblesContainer: ElementRef;

  @Input() bubbles: any[];

  step = 1;
  bubble: any = {};
  windowInnerWidth: number = window.innerWidth;
  position: any = { left: this.windowInnerWidth / 2 - 228, top: 71 };
  isCloseBubble: boolean = false;
  keyUpSubscribe: Subscription;
  element: HTMLElement;
  resizeSubscribe: Subscription;
  isTablet: boolean;
  isMobile: boolean;

  constructor(
    elementRef: ElementRef,
    private zone: NgZone,
    private browserDetectionService: BrowserDetectionService,
    private localStorageService: LocalStorageService,
    private utilsService: UtilsService,
    private store: Store<AppStates>
  ) {
    this.element = elementRef.nativeElement;
  }

  ngOnInit(): void {
    this.isTablet = this.browserDetectionService.isTablet();
    this.isMobile = this.browserDetectionService.isMobile();

    this.getBubble(this.step);

    this.resizeSubscribe = fromEvent(window, 'resize')
      .debounceTime(DEBOUNCE_TIME)
      .subscribe(() => {
        this.zone.run(() => {
          if (this.isCloseBubble || this.windowInnerWidth === window.innerWidth) {
            return;
          }

          this.windowInnerWidth = window.innerWidth;
          this.getBubble(this.step);
        });
      });

    this.keyUpSubscribe = fromEvent(document, 'keyup').subscribe((e: KeyboardEvent) => {
      if (this.isCloseBubble) {
        return;
      }

      if (e.keyCode === KeyCodes.leftArrow) {
        this.back();
      }

      if (e.keyCode === KeyCodes.rightArrow) {
        this.next();
      }
    });
  }

  ngOnDestroy(): void {
    this.keyUpSubscribe.unsubscribe();

    if (this.resizeSubscribe.unsubscribe) {
      this.resizeSubscribe.unsubscribe();
    }
  }

  back(): void {
    if (this.step === 1) {
      return;
    }

    this.step -= 1;
    this.getBubble(this.step);
  }

  next(): void {
    if (this.step === this.bubbles.length) {
      return;
    }

    this.step += 1;
    this.getBubble(this.step);
  }

  getBubble(step: number): void {
    let baloonDirector: string;

    if (step === 1) {
      baloonDirector = '.street-box';
      this.bubble = find(this.bubbles, ['name', 'street']);
    }

    if (step === 2) {
      baloonDirector = 'things-filter';
      this.bubble = find(this.bubbles, ['name', 'thing']);
    }

    if (step === 3) {
      baloonDirector = 'countries-filter';
      this.bubble = find(this.bubbles, ['name', 'geography']);
    }

    if (step === 4) {
      baloonDirector = '.street-box';
      this.bubble = find(this.bubbles, ['name', 'income']);
    }

    if (step === 5) {
      baloonDirector = '.street-box';
      this.bubble = find(this.bubbles, ['name', 'image']);
    }

    if (step === 6) {
      baloonDirector = 'main-menu';
    }

    setTimeout(() => {
      this.utilsService.getCoordinates(baloonDirector, (data: any) => {
        let baloonElementRect: ClientRect = this.bubblesContainer.nativeElement.getBoundingClientRect();
        let baloonWidth = baloonElementRect.width;
        let baloonHeight = baloonElementRect.height;

        data.top += data.height;

        if (this.isMobile) {
          data.left = this.windowInnerWidth / 2 - baloonWidth / 2;
          this.position = this.setBubblePositionMobile(step, data, baloonWidth, baloonHeight);
        } else {
          this.position = this.setBubblePositionDesktop(step, data, baloonWidth, baloonHeight);
        }

        if (step === 6) {
          this.localStorageService.setItem('quick-guide', true);
          this.store.dispatch(new MatrixActions.OpenQuickGuide(false));
        }
      });
    }, 100);
  }

  setBubblePositionMobile(step: number, data: any, baloonWidth: number, baloonHeight: number): any {
    if (step === 1) {
      data.top += 16;
    }

    if (step === 2) {
      data.top += 3;
    }

    if (step === 3) {
      data.top -= 2;
    }

    if (step === 6) {
      data.top = 57;
      data.left = 5;

      data.top = data.top - data.height / 2 - baloonHeight / 2;
      data.left = data.left + baloonWidth / 2 - 15;

      setTimeout(() => {
        this.isCloseBubble = true;
      }, 100);
    }

    return data;
  }

  setBubblePositionDesktop(step: number, data: any, baloonWidth: number, baloonHeight: number): any {
    if (step === 1 || step === 4) {
      data.top -= 12;
      data.left = this.windowInnerWidth / 2 - baloonWidth / 2;
    }

    if (step === 2) {
      data.top += 17;
      data.left -= 7;
    }

    if (step === 3) {
      if (this.isTablet) {
        data.top += 13;
      } else {
        data.top += 17;
      }

      data.left = data.left - baloonWidth / 2 + data.width / 2;
    }

    if (step === 5) {
      data.left = this.windowInnerWidth / 2 - baloonWidth / 2;
    }

    if (step === 6) {
      data.top = data.top - data.height / 2 - baloonHeight / 2;
      data.left = data.left + data.width / 2 - baloonWidth / 2;
      this.isCloseBubble = true;
    }

    return data;
  }
}
