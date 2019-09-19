import { Injectable } from '@angular/core';
import { round } from 'lodash';

@Injectable()
export class MathService {
  keepDecimals = 2;

  roundIncome(income = 0, decimal = false): number {
    return decimal ? round(income, this.keepDecimals) : round(income);
  }

  round(income = 0): number {
    return round(income);
  }
}
