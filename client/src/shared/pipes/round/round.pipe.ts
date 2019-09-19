import { Pipe, PipeTransform } from '@angular/core';
import { round } from 'lodash-es';

@Pipe({ name: 'roundTo' })
export class RoundToPipe implements PipeTransform {
  transform(input: number | string, toNumber = 2) {
    const value = input.toString().replace(/[^0-9.]/g, '');

    return round(Number(value), toNumber).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ');
  }
}
