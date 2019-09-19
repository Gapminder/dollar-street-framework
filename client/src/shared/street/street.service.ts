import { fromEvent } from 'rxjs/observable/fromEvent';
import { Subject } from 'rxjs/Subject';
import { Injectable } from '@angular/core';
import { MathService, BrowserDetectionService } from '../../common';
import { scaleLog } from 'd3-scale';
import { axisBottom } from 'd3-axis';
import { select } from 'd3-selection';

import { get, chain } from 'lodash-es';
import { SVG_DEFAULTS } from './svg-parameters';
import {
  AppStates,
  DrawDividersInterface,
  Place,
  DividersGaps,
  Currency,
  TimeUnit,
  InitStreet,
  IncomeFilter
} from '../../interfaces';
import { DefaultUrlParameters } from '../../defaultState';
import { Store } from '@ngrx/store';
import * as MatrixActions from '../../matrix/ngrx/matrix.actions';
import { Subscription } from 'rxjs/Subscription';

@Injectable()
export class StreetDrawService {
  width: number;
  height: number;
  halfOfHeight: number;
  lowIncome: number;
  highIncome: number;
  streetOffset = 60;
  chosenPlaces: Place[];
  poorest: string;
  richest: string;
  scale;
  axisLabel: number[] = [];
  levelLabels: string[] = [];
  svg;
  mouseMoveSubscriber: Subscription;
  mouseLeaveSubscriptrion: Subscription;
  dividersData: DrawDividersInterface;
  mouseUpSubscriber;
  touchMoveSubscriber;
  touchUpSubscriber;
  sliderRightBorder: number;
  sliderLeftBorder: number;
  sliderRightMove = false;
  sliderLeftMove = false;
  draggingSliders = false;
  draggableFilterWidth = 0;
  leftScroll;
  rightScroll;
  leftPoint;
  rightPoint;
  leftScrollOpacityStreet;
  leftScrollOpacityLabels;
  leftScrollOpacityHomes;
  rightScrollOpacityStreet;
  rightScrollOpacityLabels;
  rightScrollOpacityHomes;
  leftScrollText;
  rightScrollText;
  hoverPlace;
  minIncome;
  maxIncome;
  regions: string[] | string;
  thingname: string;
  countries: string[] | string;
  placesArray: Place[] = [];
  currentLowIncome: number;
  currentHighIncome: number;
  filter: Subject<IncomeFilter> = new Subject<IncomeFilter>();
  windowInnerWidth: number = window.innerWidth;
  isDesktop: boolean;
  isMobile: boolean;
  currencyUnit: Currency;
  timeUnit: TimeUnit;
  isWorkSliderOnMobile = false;
  showLabelAboveStreet = false;
  startSliderPosition = 0;
  endSliderPosition = 0;
  previousMousePosition: number | null = null;
  stopRightDirection = false;
  stopLeftDirection = false;
  draggableSliderLeftPosition: number | null = null;

  colors = {
    fills: {
      Europe: '#FFE800',
      Africa: '#15B0D1',
      'The Americas': '#B1E826',
      Asia: '#F23373'
    },
    fillsOfBorders: {
      Europe: '#dbc700',
      Africa: '#119ab7',
      'The Americas': '#96c61d',
      Asia: '#bc1950'
    }
  };

  constructor(
    private math: MathService,
    browserDetectionService: BrowserDetectionService,
    private store: Store<AppStates>
  ) {
    this.isDesktop = browserDetectionService.isDesktop();
    this.isMobile = browserDetectionService.isMobile();
  }

  init(defaultInitStreet: InitStreet): this {
    this.thingname = defaultInitStreet.thing;
    this.countries = defaultInitStreet.countries[0];
    this.regions = defaultInitStreet.regions[0];
    this.axisLabel = defaultInitStreet.drawDividers.dividers;
    this.isWorkSliderOnMobile = defaultInitStreet.isWorkSliderOnMobile;
    this.showLabelAboveStreet = defaultInitStreet.showLabelAboveStreet;
    this.levelLabels = [
      get(defaultInitStreet.drawDividers, 'firstLabelName', ''),
      get(defaultInitStreet.drawDividers, 'secondLabelName', ''),
      get(defaultInitStreet.drawDividers, 'thirdLabelName', ''),
      get(defaultInitStreet.drawDividers, 'fourthLabelName', '')
    ];
    this.dividersData = defaultInitStreet.drawDividers;
    this.minIncome = defaultInitStreet.drawDividers.poor;
    this.maxIncome = defaultInitStreet.drawDividers.rich;
    this.lowIncome = defaultInitStreet.lowIncome || get(defaultInitStreet.drawDividers, 'poor', 0);
    this.highIncome = defaultInitStreet.highIncome || get(defaultInitStreet.drawDividers, 'rich', 0);

    this.calculateSvgSize();

    this.scale = scaleLog()
      .domain([
        get(defaultInitStreet.drawDividers, 'poor', Number(DefaultUrlParameters.lowIncome)),
        get(defaultInitStreet.drawDividers, 'rich', Number(DefaultUrlParameters.highIncome))
      ])
      .range([0, this.width]);

    return this;
  }

  calculateSvgSize(): void {
    const svgHeight = this.svg.style('height').length ? this.svg.style('height') : 0;
    const svgWidth = this.svg.style('width').length ? this.svg.style('width') : 0;

    this.width = parseInt(svgWidth, 10) - this.streetOffset;
    this.height = parseInt(svgHeight, 10);

    this.halfOfHeight = this.height * 0.5;
    this.windowInnerWidth = window.innerWidth;

    this.startSliderPosition = (this.windowInnerWidth - this.width) / 2;
    this.endSliderPosition = this.width + this.startSliderPosition;
  }

  set setSvg(element: HTMLElement) {
    this.svg = select(element);
  }

  set(key: string, val: HTMLElement): this {
    this[key] = val;

    return this;
  }

  isDrawDividers(drawDividers: DrawDividersInterface): this {
    if (!get(drawDividers, 'showDividers', false)) {
      return;
    }

    this.svg
      .selectAll('use.square-point')
      .data(this.axisLabel)
      .enter()
      .append('use')
      .attr('xlink:href', SVG_DEFAULTS.squarePoints.name)
      .attr('fill', SVG_DEFAULTS.squarePoints.color)
      .attr('class', 'square-point')
      .attr('width', SVG_DEFAULTS.squarePoints.width)
      .attr('height', SVG_DEFAULTS.squarePoints.height)
      .attr('y', SVG_DEFAULTS.squarePoints.positionY)
      .attr('x', (d: number) => {
        return this.scale(d) - SVG_DEFAULTS.squarePoints.width / 2 + this.streetOffset / 2;
      });

    return this;
  }

  isDrawCurrency(drawDividers: DrawDividersInterface): this {
    if (!get(drawDividers, 'showCurrency', false)) {
      return;
    }

    this.svg
      .selectAll('text.scale-label')
      .data(this.axisLabel)
      .enter()
      .append('text')
      .attr('class', 'currency-text')
      .attr('text-anchor', 'middle')
      .text((d: string) => {
        return `${this.currencyUnit.symbol}${this.calculateIncomePerTimeUnit(d)}`;
      })
      .attr('x', (d: number) => {
        return this.scale(d) + this.streetOffset / 2;
      })
      .attr('class', (d: string) => {
        return `currency-text scale-label${d}`;
      })
      .attr('y', SVG_DEFAULTS.levels.positionY)
      .attr('fill', SVG_DEFAULTS.levels.color);

    return this;
  }

  isDrawLabels(drawDividers: DrawDividersInterface): this {
    if (!get(drawDividers, 'showLabels', false)) {
      return;
    }

    const data = this.levelLabels.map((curr, ind) => {
      const from = ind === 0 ? drawDividers.poor : this.axisLabel[ind - 1];
      const to = ind === this.levelLabels.length - 1 ? drawDividers.rich : this.axisLabel[ind];

      return { from, to, name: curr };
    });
    this.svg
      .selectAll('text.scale-label')
      .data(data)
      .enter()
      .append('text')
      .text((d, index) => {
        return !this.isMobile ? d.name : `L${index + 1}`;
      })
      .attr('x', (d: DividersGaps) => {
        const shift = this.isMobile ? 25 : 10;

        return (this.scale(d.to) - this.scale(d.from)) / 2 + this.scale(d.from) + shift;
      })
      .attr('y', SVG_DEFAULTS.levels.positionY)
      .attr('fill', SVG_DEFAULTS.levels.color)
      .attr('class', 'scale-label level-label');

    return this;
  }

  onMouseEvent(e: MouseEvent | Touch) {
    if (this.isWindowMobileWidth() || (!this.sliderLeftMove && !this.sliderRightMove && !this.draggingSliders)) {
      return;
    }

    if (!this.currentHighIncome || !this.currentLowIncome) {
      this.currentLowIncome = this.lowIncome;
      this.currentHighIncome = this.highIncome;
    }

    if (this.draggingSliders && !this.sliderLeftMove && !this.sliderRightMove) {
      this.draggableFilter(e.pageX);

      return;
    }

    if (this.sliderLeftMove && e.pageX <= this.sliderRightBorder - this.startSliderPosition) {
      if (e.pageX > 0) {
        return this.drawLeftSlider(e.pageX - this.startSliderPosition);
      }

      return this.drawLeftSlider(0);
    }

    if (this.sliderRightMove && e.pageX >= this.sliderLeftBorder + this.startSliderPosition) {
      if (e.pageX <= this.endSliderPosition) {
        return this.drawRightSlider(e.pageX - this.startSliderPosition);
      }

      return this.drawRightSlider(this.width);
    }
  }

  draggableFilter(cursorPosition) {
    document.body.classList.add('draggingSliders');
    this.previousMousePosition = this.previousMousePosition || cursorPosition;

    if (this.draggableSliderLeftPosition === null) {
      this.draggableSliderLeftPosition = this.sliderLeftBorder - this.startSliderPosition;
    }

    // get width between markers(sliders)
    if (!this.draggableFilterWidth) {
      this.draggableFilterWidth = this.sliderRightBorder - this.sliderLeftBorder;
    }

    const endLeftSliderPosition = this.endSliderPosition - this.draggableFilterWidth - this.startSliderPosition;

    // mouse movement from left to right
    if (cursorPosition - this.previousMousePosition > 0) {
      this.stopLeftDirection = false;
      this.draggableSliderLeftPosition =
        this.draggableSliderLeftPosition + (cursorPosition - this.previousMousePosition);

      if (this.draggableSliderLeftPosition > endLeftSliderPosition) {
        this.draggableSliderLeftPosition = endLeftSliderPosition;
      }

      if (this.sliderRightBorder >= this.endSliderPosition) {
        this.stopRightDirection = true;
        this.draggableSliderLeftPosition = endLeftSliderPosition;
      }
    }

    // mouse movement from right to left
    if (cursorPosition - this.previousMousePosition < 0) {
      this.stopRightDirection = false;
      const shift = this.draggableSliderLeftPosition + (cursorPosition - this.previousMousePosition);
      this.draggableSliderLeftPosition = shift < 0 ? 0 : shift;

      if (this.sliderLeftBorder <= this.startSliderPosition) {
        this.stopLeftDirection = true;
        this.draggableSliderLeftPosition = 0;
      }
    }

    if (!this.isMobile) {
      if (!this.stopRightDirection && !this.stopLeftDirection) {
        this.chosenPlaces = [];
        this.removeHouses('chosen');
        this.drawLeftSlider(this.draggableSliderLeftPosition);
        this.drawRightSlider(this.draggableSliderLeftPosition + this.draggableFilterWidth);
      }
    }
    this.previousMousePosition = cursorPosition;
  }

  drawScale(places: Place[], drawDividers: DrawDividersInterface, element): this {
    axisBottom(this.scale).tickFormat(() => {
      return void 0;
    });

    this.svg
      .selectAll('text.poorest')
      .data([this.poorest])
      .enter()
      .append('text')
      .attr('class', 'poorest')
      .text(this.poorest)
      .attr('x', 0)
      .attr('y', () => {
        return this.isMobile ? SVG_DEFAULTS.levels.mobilePositionY : SVG_DEFAULTS.levels.positionY;
      })
      .attr('fill', SVG_DEFAULTS.levels.color);

    this.svg
      .selectAll('text.richest')
      .data([this.richest])
      .enter()
      .append('text')
      .attr('class', 'richest')
      .text(this.richest)
      .attr('y', () => {
        return this.isMobile ? SVG_DEFAULTS.levels.mobilePositionY : SVG_DEFAULTS.levels.positionY;
      })
      .attr('fill', SVG_DEFAULTS.levels.color);

    const svgElement: SVGElementInstance = element.getElementsByClassName('chart')[0];
    const svgElementNodes: SVGElementInstanceList = svgElement.childNodes;
    let richestWidth = svgElementNodes[1].getBBox().width;

    richestWidth = !isNaN(richestWidth) ? richestWidth : 54;

    this.svg.selectAll('text.richest').attr('x', this.width + this.streetOffset - richestWidth);

    if (places && places.length) {
      this.placesArray = chain(places)
        .uniqBy('_id')
        .sortBy('income')
        .value();

      this.minIncome = drawDividers.poor;
      this.maxIncome = drawDividers.rich;

      this.leftPoint = this.scale(this.minIncome) - SVG_DEFAULTS.sliders.moreThenNeed;
      this.rightPoint = this.scale(this.maxIncome) + SVG_DEFAULTS.sliders.moreThenNeed;

      this.svg
        .selectAll('use.icon-background-home')
        .data(places)
        .enter()
        .append('use')
        .attr('class', 'icon-background-home')
        .attr('y', SVG_DEFAULTS.backgroungHomes.positionY)
        .attr('width', SVG_DEFAULTS.backgroungHomes.width)
        .attr('height', SVG_DEFAULTS.backgroungHomes.height)
        .attr('fill', SVG_DEFAULTS.backgroungHomes.fill)
        .attr('xlink:href', SVG_DEFAULTS.backgroungHomes.name)
        .attr('income', (datum: Place) => {
          return datum.income;
        })
        .attr('home-id', (datum: Place) => {
          return datum._id;
        })
        .attr('x', (datum: Place) => {
          const scaleDatumIncome = this.scale(datum.income);

          return scaleDatumIncome + this.streetOffset / 2 - SVG_DEFAULTS.backgroungHomes.width / 2;
        });
    }

    this.svg
      .append('polygon')
      .attr('class', 'road')
      .attr('height', SVG_DEFAULTS.road.height)
      .attr('points', () => {
        const point1 = `0,${this.halfOfHeight + 11}`;
        const point2 = `30,${this.halfOfHeight - 4}`;
        const point3 = `${this.width + this.streetOffset - this.streetOffset / 2},${this.halfOfHeight - 4}`;
        const point4 = `${this.width + this.streetOffset},${this.halfOfHeight + 11}`;

        return `${point1} ${point2} ${point3} ${point4}`;
      })
      .style('fill', SVG_DEFAULTS.road.background)
      .style('cursor', '-webkit-grab')
      .style('cursor', '-moz-grab')
      .style('cursor', 'grab')
      .on(
        'mousedown',
        (): void => {
          this.draggingSliders = true;
        }
      )
      .on('touchstart', () => (this.draggingSliders = true), { passive: true });

    this.svg
      .append('line')
      .attr('class', 'axis')
      .attr('height', SVG_DEFAULTS.road.line.height)
      .attr('x1', 1)
      .attr('y1', this.halfOfHeight + 11.5)
      .attr('x2', this.width + this.streetOffset - 1)
      .attr('y2', this.halfOfHeight + 11.5)
      .attr('stroke-width', SVG_DEFAULTS.road.line.height)
      .attr('stroke', SVG_DEFAULTS.road.line.color)
      .style('cursor', '-webkit-grab')
      .style('cursor', '-moz-grab')
      .style('cursor', 'grab')
      .on(
        'mousedown',
        (): void => {
          this.draggingSliders = true;
        }
      )
      .on('touchstart', () => (this.draggingSliders = true), { passive: true });

    this.svg
      .append('line')
      .attr('class', 'dash')
      .attr('x1', 24)
      .attr('y1', this.halfOfHeight + 4)
      .attr('x2', this.width + this.streetOffset - 9)
      .attr('y2', this.halfOfHeight + 3)
      .attr('stroke-dasharray', '17')
      .attr('stroke-width', 2)
      .attr('stroke', 'white')
      .style('cursor', '-webkit-grab')
      .style('cursor', '-moz-grab')
      .style('cursor', 'grab')

      .on(
        'mousedown',
        (): void => {
          this.draggingSliders = true;
        }
      )
      .on('touchstart', (): boolean => (this.draggingSliders = true), { passive: true });

    this.isDrawDividers(drawDividers);
    this.isDrawCurrency(drawDividers);
    this.isDrawLabels(drawDividers);

    if (!places || !places.length) {
      return this;
    }

    this.drawLeftSlider(this.scale(this.lowIncome), true);
    this.drawRightSlider(this.scale(this.highIncome), true);

    if (this.mouseLeaveSubscriptrion) {
      this.mouseLeaveSubscriptrion.unsubscribe();
    }

    if (this.mouseMoveSubscriber) {
      this.mouseMoveSubscriber.unsubscribe();
    }

    this.mouseLeaveSubscriptrion = fromEvent(document, 'mouseleave', { passive: true }).subscribe((e: MouseEvent) => {
      this.onMouseEvent(e);
    });

    this.mouseMoveSubscriber = fromEvent(window, 'mousemove', { passive: true }).subscribe((e: MouseEvent) => {
      this.onMouseEvent(e);
    });

    if (this.touchMoveSubscriber) {
      this.touchMoveSubscriber.unsubscribe();
    }

    this.touchMoveSubscriber = fromEvent(window, 'touchmove', { passive: true }).subscribe((e: TouchEvent) => {
      this.onMouseEvent(e.touches[0]);
    });

    this.mouseUpSubscriber = fromEvent(window, 'mouseup', { passive: true }).subscribe(() => {
      if (!this.sliderLeftMove && !this.sliderRightMove && !this.draggingSliders) {
        return;
      }

      this.pressedSlider();
    });

    this.touchUpSubscriber = fromEvent(window, 'touchend', { passive: true }).subscribe(() => {
      if (!this.sliderLeftMove && !this.sliderRightMove && !this.draggingSliders) {
        return;
      }

      this.pressedSlider();
    });

    return this;
  }

  drawHoverHouse(place) {
    if (!place) {
      this.removeHouses('hover');

      return this;
    }

    this.removeSliders();

    this.svg
      .selectAll('use.icon-hover-home')
      .data([place])
      .enter()
      .append('use')
      .attr('class', 'icon-hover-home')
      .attr('class', 'hover')
      .attr('y', SVG_DEFAULTS.hoverHomes.positionY)
      .attr('width', SVG_DEFAULTS.hoverHomes.width)
      .attr('height', SVG_DEFAULTS.hoverHomes.height)
      .attr('fill', SVG_DEFAULTS.hoverHomes.fill)
      .attr('xlink:href', SVG_DEFAULTS.hoverHomes.name)
      .attr('income', (datum: Place) => {
        return datum.income;
      })
      .attr('home-id', (datum: Place) => {
        return datum._id;
      })
      .attr('x', (datum: Place) => {
        const scaleDatumIncome = this.scale(datum.income);

        return this.streetOffset / 2 + scaleDatumIncome - SVG_DEFAULTS.hoverHomes.differenceSizeHover;
      });

    this.drawLeftSlider(this.scale(this.lowIncome), true);
    this.drawRightSlider(this.scale(this.highIncome), true);

    this.svg
      .selectAll('rect.hover-bg')
      .data([place])
      .enter()
      .append('rect')
      .attr('rx', 3)
      .attr('ry', 3)
      .attr('class', 'hover-bg')
      .attr('width', (datum: Place) => {
        const widthBySymbol = datum.showIncome.toString().length * SVG_DEFAULTS.hoverHomes.textBg.widthBySymbol;
        const maxWidth = SVG_DEFAULTS.hoverHomes.textBg.width;
        if (widthBySymbol < maxWidth) {
          return widthBySymbol;
        }

        return maxWidth;
      })
      .attr('height', SVG_DEFAULTS.hoverHomes.textBg.height)
      .attr('y', SVG_DEFAULTS.hoverHomes.textBg.positionY)
      .attr('fill', SVG_DEFAULTS.hoverHomes.textBg.fill)
      .attr('stroke', SVG_DEFAULTS.hoverHomes.textBg.stroke)
      .attr('stroke-width', SVG_DEFAULTS.hoverHomes.textBg.strokeWidth)
      .attr('x', (datum: Place) => {
        const widthBySymbol = datum.showIncome.toString().length * SVG_DEFAULTS.hoverHomes.textBg.widthBySymbol;
        const maxWidth = SVG_DEFAULTS.hoverHomes.textBg.width;
        const width = widthBySymbol < maxWidth ? widthBySymbol : maxWidth;
        const scaleDatumIncome = this.scale(datum.income);

        return this.streetOffset / 2 + scaleDatumIncome - width / 2;
      });

    this.svg
      .selectAll('text.hover-house-text')
      .data([place])
      .enter()
      .append('text')
      .attr('class', 'hover-house-text')
      .attr('y', SVG_DEFAULTS.hoverHomes.text.positionY)
      .attr('fill', SVG_DEFAULTS.hoverHomes.text.fill)
      .attr('style', SVG_DEFAULTS.hoverHomes.text.styles)
      .attr('text-anchor', 'middle')
      .attr('x', (home: Place) => {
        return this.scale(home.income) + this.streetOffset / 2;
      })
      .text((home: Place) => {
        return `${this.currencyUnit.symbol ? this.currencyUnit.symbol : ''}${home.showIncome ? home.showIncome : ''}`;
      });

    return this;
  }

  drawLeftSlider(x: number, init = false): this {
    if (this.isWindowMobileWidth() && Math.round(this.lowIncome) === this.dividersData.poor && this.leftScroll) {
      return;
    }

    const position = x > 0 ? x : 0;
    this.sliderLeftBorder = position + this.startSliderPosition;

    if (!this.leftScrollOpacityHomes) {
      this.leftScrollOpacityHomes = this.svg
        .append('rect')
        .attr('class', 'left-scroll-opacity-part-homes')
        .attr('x', SVG_DEFAULTS.sliders.differentSize)
        .attr('y', () => (this.isMobile ? 10 : 0))
        .attr('height', 28.8)
        .style('fill', 'white')
        .style('opacity', '0.6');
    }

    if (!this.leftScrollOpacityStreet) {
      this.leftScrollOpacityStreet = this.svg
        .append('rect')
        .attr('class', 'left-scroll-opacity-part-street')
        .attr('x', 0)
        .attr('y', SVG_DEFAULTS.road.positionY)
        .attr('height', SVG_DEFAULTS.road.overlay.height)
        .style('fill', 'white')
        .style('opacity', '0.8');
    }

    if (!this.leftScrollOpacityLabels) {
      this.leftScrollOpacityLabels = this.svg;

      const width = position + this.streetOffset > 0 ? position + this.streetOffset : 0;

      if (position < this.streetOffset + SVG_DEFAULTS.sliders.moreThenNeed) {
        this.leftScrollOpacityLabels
          .append('rect')
          .attr('class', 'left-scroll-opacity-labels')
          .attr('x', 0)
          .attr('y', 50)
          .attr('height', 15)
          .style('fill', 'white')
          .attr('width', width)
          .style('opacity', '0.1');
      } else {
        this.leftScrollOpacityLabels
          .append('rect')
          .attr('class', 'left-scroll-opacity-labels')
          .attr('x', 0)
          .attr('y', 50)
          .attr('height', 15)
          .style('fill', 'white')
          .attr('width', width)
          .style('opacity', '0.6');
      }
    }
    if (!this.leftScroll) {
      this.leftScroll = this.svg
        .append('use')
        .attr('class', 'left-scroll')
        .style('fill', SVG_DEFAULTS.sliders.color)
        .attr('id', 'left-scroll')
        .attr('xlink:href', SVG_DEFAULTS.sliders.name)
        .attr('width', SVG_DEFAULTS.sliders.width)
        .attr('height', SVG_DEFAULTS.sliders.height)
        .attr('y', SVG_DEFAULTS.sliders.positionY)
        .attr('style', 'cursor: pointer ')
        .on(
          'mousedown',
          (): void => {
            this.sliderLeftMove = true;
          }
        )
        .on('touchstart', (): boolean => (this.sliderLeftMove = true));
    }

    this.leftScroll.attr('x', () => {
      if (position < this.endSliderPosition) {
        return position + SVG_DEFAULTS.sliders.differentSize;
      }

      return this.endSliderPosition - SVG_DEFAULTS.minSliderSpace;
    });

    this.leftScrollOpacityStreet.attr('width', position + this.streetOffset / 2);
    this.leftScrollOpacityHomes.attr('width', position + this.streetOffset / 2 - SVG_DEFAULTS.sliders.moreThenNeed / 2);

    this.lowIncome = this.scale.invert(position);

    if (init) {
      return this;
    }

    this.drawScrollLabel();

    return this;
  }

  isWindowMobileWidth(): boolean {
    return this.windowInnerWidth <= SVG_DEFAULTS.mobileWidth && !this.isWorkSliderOnMobile;
  }

  drawRightSlider(x: number, init = false): this {
    if (this.isWindowMobileWidth() && Math.round(this.highIncome) === this.dividersData.rich && this.rightScroll) {
      return;
    }
    let position = x > this.endSliderPosition ? this.endSliderPosition : x;
    this.sliderRightBorder = position + this.startSliderPosition;

    if (!this.rightScrollOpacityHomes) {
      this.rightScrollOpacityHomes = this.svg
        .append('rect')
        .attr('class', 'left-scroll-opacity-part-homes')
        .attr('x', -2)
        .attr('y', () => (this.isMobile ? 10 : 0))
        .attr('height', 28.8)
        .style('fill', 'white')
        .style('opacity', '0.65');
    }

    if (!this.rightScrollOpacityStreet) {
      this.rightScrollOpacityStreet = this.svg
        .append('rect')
        .attr('class', 'right-scroll-opacity-part-street')
        .attr('x', -2)
        .attr('y', SVG_DEFAULTS.road.positionY)
        .attr('height', SVG_DEFAULTS.road.overlay.height)
        .style('fill', SVG_DEFAULTS.road.color)
        .style('opacity', SVG_DEFAULTS.road.opacity);
    }

    if (!this.rightScrollOpacityLabels) {
      this.rightScrollOpacityLabels = this.svg;

      if (position > this.width - SVG_DEFAULTS.sliders.moreThenNeed) {
        const width = this.width - position + this.streetOffset > 0 ? this.width - position + this.streetOffset : 0;
        this.rightScrollOpacityLabels
          .append('rect')
          .attr('class', 'right-scroll-opacity-labels')
          .attr('x', position)
          .attr('y', 50)
          .attr('height', 15)
          .style('fill', 'white')
          .attr('width', width)
          .style('opacity', '0.1');
      } else {
        this.rightScrollOpacityLabels
          .append('rect')
          .attr('class', 'right-scroll-opacity-labels')
          .attr('x', position)
          .attr('y', 50)
          .attr('height', 15)
          .style('fill', 'white')
          .attr('width', () => {
            const width = this.width - position + this.streetOffset;

            return width > 0 ? width : 0;
          })
          .style('opacity', '0.65');
      }
    }

    if (!this.rightScroll) {
      this.rightScroll = this.svg
        .append('use')
        .attr('class', 'right-scroll')
        .style('fill', SVG_DEFAULTS.sliders.color)
        .attr('id', 'right-scroll')
        .attr('xlink:href', SVG_DEFAULTS.sliders.name)
        .attr('width', SVG_DEFAULTS.sliders.width)
        .attr('height', SVG_DEFAULTS.sliders.height)
        .attr('y', SVG_DEFAULTS.sliders.positionY)
        .attr('style', 'cursor: pointer')
        .on(
          'mousedown',
          (): void => {
            this.sliderRightMove = true;
          }
        )
        .on('touchstart', (): boolean => (this.sliderRightMove = true));
    }

    this.rightScroll.attr('x', () => {
      if (this.rightPoint <= position) {
        return (position = this.rightPoint);
      }

      return position + SVG_DEFAULTS.sliders.differentSize;
    });

    if (this.thingname !== 'Families' || this.countries !== 'World' || (this.regions !== 'World' && !this.isMobile)) {
      if (
        Math.round(this.rightPoint + this.streetOffset / 2) < Math.round(position + this.streetOffset / 2 - 1) &&
        !this.isMobile
      ) {
        this.sliderRightBorder = this.rightPoint + 12;

        this.rightScrollOpacityStreet
          .attr('x', this.rightPoint + this.streetOffset / 2)
          .attr('width', this.width + this.streetOffset / 2);
        this.rightScrollOpacityHomes
          .attr('x', this.rightPoint + this.streetOffset / 2)
          .attr('width', this.width + this.streetOffset / 2);
      } else {
        this.rightScrollOpacityStreet
          .attr('x', position + this.streetOffset / 2)
          .attr('width', this.width + this.streetOffset / 2 - position);
        this.rightScrollOpacityHomes
          .attr('x', position + this.streetOffset / 2 + 1.5)
          .attr('width', this.width + this.streetOffset / 2 - position);
      }
    } else {
      const width =
        this.width + this.streetOffset / 2 - position > 0 ? this.width + this.streetOffset / 2 - position : 0;
      this.rightScrollOpacityStreet.attr('x', position + this.streetOffset / 2).attr('width', width);
      this.rightScrollOpacityHomes.attr('x', position + this.streetOffset / 2).attr('width', width);
    }

    this.highIncome = this.scale.invert(position);

    if (init) {
      return this;
    }

    this.drawScrollLabel();

    return this;
  }

  clearAndRedraw(places?): this {
    this.removeHouses('hover');
    this.removeHouses('chosen');

    if (!places || !places.length) {
      return this;
    }

    this.removeSliders();

    this.drawHouses(places);

    this.drawHoverHouse(this.hoverPlace);

    this.drawLeftSlider(this.scale(this.lowIncome), true);
    this.drawRightSlider(this.scale(this.highIncome), true);

    return this;
  }

  removeHouses(selector: string): this {
    this.svg.selectAll(`rect.${selector}`).remove();
    this.svg.selectAll(`polygon.${selector}`).remove();
    this.svg.selectAll(`use.${selector}`).remove();
    this.svg.selectAll(`use#${selector}`).remove();

    if (selector === 'chosen') {
      this.svg.selectAll('polygon.chosenLine').remove();
      this.svg.selectAll('use.icon-active-homes').remove();
    }

    if (selector === 'hover') {
      this.svg.selectAll('text.hover-house-text').remove();
      this.svg.selectAll('rect.hover-bg').remove();
    }

    return this;
  }

  removeSliders(): this {
    this.svg.selectAll('use#right-scroll').remove();
    this.svg.selectAll('use#left-scroll').remove();
    this.leftScroll = false;
    this.rightScroll = false;

    return this;
  }

  clearSvg(): this {
    this.leftScroll = void 0;
    this.rightScroll = void 0;
    this.leftScrollOpacityStreet = void 0;
    this.leftScrollOpacityHomes = void 0;
    this.leftScrollOpacityLabels = void 0;
    this.rightScrollOpacityLabels = void 0;
    this.rightScrollOpacityStreet = void 0;
    this.rightScrollOpacityHomes = void 0;
    this.leftScrollText = void 0;
    this.rightScrollText = void 0;

    this.svg.selectAll('*').remove();

    return this;
  }

  drawScrollLabel(): this {
    const poorGaps = this.getDividersGaps(this.dividersData.poor);
    const richGaps = this.getDividersGaps(this.dividersData.rich);

    const lowGaps = this.getDividersGaps(this.dividersData.low);
    const mediumGaps = this.getDividersGaps(this.dividersData.medium);
    const hightGaps = this.getDividersGaps(this.dividersData.high);

    let incomeL = Math.round(this.lowIncome ? this.lowIncome : 0);
    let incomeR = Math.round(this.highIncome ? this.highIncome : this.dividersData.rich);

    if (incomeR > this.dividersData.rich) {
      incomeR = this.dividersData.rich;
    }

    const xL = this.scale(incomeL);
    const xR = this.scale(incomeR);

    if (this.dividerFallWithinGaps(xL, lowGaps) || this.dividerFallWithinGaps(xR, lowGaps)) {
      this.svg.selectAll(`text.scale-label${this.dividersData.low}`).attr('fill', SVG_DEFAULTS.levels.colorToHide);
    } else {
      this.svg.selectAll(`text.scale-label${this.dividersData.low}`).attr('fill', SVG_DEFAULTS.levels.color);
    }

    if (this.dividerFallWithinGaps(xL, mediumGaps) || this.dividerFallWithinGaps(xR, mediumGaps)) {
      this.svg.selectAll(`text.scale-label${this.dividersData.medium}`).attr('fill', SVG_DEFAULTS.levels.colorToHide);
    } else {
      this.svg.selectAll(`text.scale-label${this.dividersData.medium}`).attr('fill', SVG_DEFAULTS.levels.color);
    }

    if (this.dividerFallWithinGaps(xL, hightGaps) || this.dividerFallWithinGaps(xR, hightGaps)) {
      this.svg.selectAll(`text.scale-label${this.dividersData.high}`).attr('fill', SVG_DEFAULTS.levels.colorToHide);
    } else {
      this.svg.selectAll(`text.scale-label${this.dividersData.high}`).attr('fill', SVG_DEFAULTS.levels.color);
    }

    if (this.dividerFallWithinGaps(xL, poorGaps) || this.dividerFallWithinGaps(xR, poorGaps)) {
      this.svg.selectAll('text.poorest').attr('fill', SVG_DEFAULTS.levels.colorToHide);
    } else {
      this.svg.selectAll('text.poorest').attr('fill', SVG_DEFAULTS.levels.color);
    }

    if (this.dividerFallWithinGaps(xL, richGaps) || this.dividerFallWithinGaps(xR, richGaps)) {
      this.svg.selectAll('text.richest').attr('fill', SVG_DEFAULTS.levels.colorToHide);
    } else {
      this.svg.selectAll('text.richest').attr('fill', SVG_DEFAULTS.levels.color);
    }

    incomeL = this.calculateIncomePerTimeUnit(incomeL * this.currencyUnit.value);

    incomeR = this.calculateIncomePerTimeUnit(incomeR * this.currencyUnit.value);

    if (!this.leftScrollText) {
      this.leftScrollText = this.initScrollLabel(incomeL, 'left');
    }

    if (!this.rightScrollText) {
      this.rightScrollText = this.initScrollLabel(incomeR, 'right');
    }

    this.setScrollLabelText(incomeL, xL, true);
    this.setScrollLabelText(incomeR, xR, false);

    return this;
  }

  initScrollLabel(income, side) {
    const positionY = this.showLabelAboveStreet ? 12 : this.height - 2;

    return this.svg
      .append('text')
      .attr('class', `${side}-scroll-label`)
      .text(`${this.currencyUnit.symbol}${income}`)
      .attr('y', positionY)
      .attr('fill', SVG_DEFAULTS.levels.color);
  }

  setScrollLabelText(setIncome, setScaleIncome, isLeftSide) {
    let scaleIncome = setScaleIncome;
    let income = setIncome;
    const scrollText = isLeftSide ? this.leftScrollText : this.rightScrollText;
    const scrollTextStyle = scrollText.node().getBBox();

    const scrollTextWidth = parseInt(scrollTextStyle.width, 10);

    if (
      Math.round(this.leftPoint + this.streetOffset / 2) > Math.round(scaleIncome + this.streetOffset / 2 + 4) &&
      (this.thingname !== 'Families' || this.countries !== 'World' || this.regions !== 'World') &&
      !this.isMobile
    ) {
      income = Math.round(this.minIncome * this.currencyUnit.value);
      income = this.math.roundIncome(income);

      scaleIncome = this.leftPoint;
    }
    scrollText
      .text(`${this.currencyUnit.symbol}${income}`)
      .attr('x', () => scaleIncome + this.streetOffset / 2 - 4.5 - scrollTextWidth / 2);
  }

  getDividersGaps(divider: number, dividersSpace = SVG_DEFAULTS.sliders.gaps): DividersGaps {
    const coordsDivider = this.scale(divider);

    const dividerGaps = {
      from: coordsDivider - dividersSpace,
      to: coordsDivider + dividersSpace
    };

    return dividerGaps;
  }

  dividerFallWithinGaps(dividerPosition: number, dividersGap: DividersGaps): boolean {
    return dividerPosition >= dividersGap.from && dividerPosition <= dividersGap.to;
  }

  drawHouses(places: Place[]): this {
    this.placesArray = [];

    if (!places || !places.length) {
      return this;
    }

    this.svg
      .selectAll('use.icon-active-homes')
      .data(places)
      .enter()
      .append('use')
      .attr('class', 'icon-active-homes')
      .attr('class', 'chosen')
      .attr('y', SVG_DEFAULTS.activeHomes.positionY)
      .attr('width', SVG_DEFAULTS.activeHomes.width)
      .attr('height', SVG_DEFAULTS.activeHomes.height)
      .attr('fill', SVG_DEFAULTS.activeHomes.fill)
      .attr('xlink:href', SVG_DEFAULTS.activeHomes.name)
      .attr('income', (datum: Place) => {
        return datum.income;
      })
      .attr('home-id', (datum: Place) => {
        return datum._id;
      })
      .attr('x', (datum: Place) => {
        const scaleDatumIncome = this.scale(datum.income);

        return scaleDatumIncome + this.streetOffset / 2 - SVG_DEFAULTS.activeHomes.width / 2;
      });

    return this;
  }

  resetSliderVariables() {
    this.draggingSliders = false;
    this.draggableFilterWidth = 0;
    this.draggableSliderLeftPosition = null;
    this.previousMousePosition = null;
  }

  pressedSlider(): void {
    document.body.classList.remove('draggingSliders');
    this.store.dispatch(new MatrixActions.RemovePlace({}));
    if (this.draggingSliders && !this.draggableFilterWidth) {
      this.resetSliderVariables();

      if (this.leftScrollText || this.rightScrollText) {
        this.leftScrollText.text('');
        this.rightScrollText.text('');
      }

      return;
    }

    if (this.sliderLeftMove && (!this.currentLowIncome || this.currentLowIncome === this.lowIncome)) {
      this.sliderLeftMove = false;
      this.currentLowIncome = void 0;
      this.currentHighIncome = void 0;

      if (this.leftScrollText || this.rightScrollText) {
        this.leftScrollText.text('');
        this.rightScrollText.text('');
      }

      return;
    }

    if (this.sliderRightMove && (!this.currentHighIncome || this.currentHighIncome === this.highIncome)) {
      this.sliderRightMove = false;
      this.currentLowIncome = void 0;
      this.currentHighIncome = void 0;

      if (this.leftScrollText || this.rightScrollText) {
        this.leftScrollText.text('');
        this.rightScrollText.text('');
      }

      return;
    }

    this.resetSliderVariables();
    this.sliderLeftMove = this.sliderRightMove = false;
    this.currentLowIncome = void 0;
    this.currentHighIncome = void 0;

    if (this.highIncome > this.dividersData.rich) {
      this.highIncome = this.dividersData.rich;
    }
    let lowFilter = Math.round(this.lowIncome);
    let highFilter = Math.round(this.highIncome);

    if (this.lowIncome - 1 <= this.minIncome) {
      lowFilter = Math.round(this.minIncome - SVG_DEFAULTS.sliders.moreThenNeed);
    }

    if (this.highIncome + 1 >= this.maxIncome) {
      highFilter = Math.round(this.maxIncome + SVG_DEFAULTS.sliders.moreThenNeed);
    }
    this.filter.next({
      lowIncome: lowFilter,
      highIncome: highFilter
    });
  }

  factorTimeUnit(unitCode: string): number {
    return SVG_DEFAULTS.factorTimeUnits[unitCode];
  }

  calculateIncomePerTimeUnit(income): number {
    const factorTimeUnit = this.factorTimeUnit(this.timeUnit.per);

    return this.math.roundIncome(income * factorTimeUnit);
  }
}
