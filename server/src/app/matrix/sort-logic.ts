// TODO: Refactor callbacks in case you touch this file
// Todo: Need refactor according to "noImplicitAny" rule

import { compact, flattenDeep, forEach, head, reduce, uniqBy, zip } from 'lodash';

interface SortMethods {
  getZoom(places: string[], column: number, cb: Function): void;
}

export class Sort implements SortMethods {
  getZoom(places: string[], column: number, cb: Function): void {
    const groupColumn: number[] = this.houseInColumnGroup(places, column);
    const totalPlaces = groupColumn.map(
      (group: number, i: number): string[] => {
        if (i === groupColumn.length - 1) {
          return places.splice(0, group).reverse();
        }

        if (i !== 0) {
          return this.treeArr(places.splice(0, group));
        }

        return places.splice(0, group);
      }
    );

    this.columnToRow(totalPlaces, column, cb);
  }
  // tslint:disable-next-line:prefer-function-over-method
  private houseInColumnGroup(places: string[], column: number): number[] {
    const houseInColumnArr = [];
    const placesLength = places.length;
    const maxNumber = Math.ceil(placesLength / column);
    const countOfMAxNumbers = placesLength % column;
    const middleElement = placesLength / column - ((placesLength / column) % 1);

    if (countOfMAxNumbers === 0) {
      for (let i = 0; i < column; i++) {
        houseInColumnArr[i] = maxNumber;
      }
    } else {
      for (let t = 0; t < countOfMAxNumbers; t++) {
        houseInColumnArr[t] = maxNumber;
      }

      const houseInColumnArrLength = houseInColumnArr.length;
      const needsElementCount = column - houseInColumnArrLength;

      for (let j = 0; j < needsElementCount; j++) {
        if (houseInColumnArrLength === 1) {
          houseInColumnArr.splice(1, 0, middleElement);

          continue;
        }

        houseInColumnArr.splice(houseInColumnArrLength - 1, 0, middleElement);
      }
    }

    return houseInColumnArr;
  }

  // tslint:disable-next-line:prefer-function-over-method
  private treeArr(arr: string[]) {
    const newArr = [];
    let element;
    const length = arr.length;

    for (let j = 0; j < length; j++) {
      j % 2 === 0 ? (element = arr.pop()) : (element = arr.shift());

      newArr.unshift(element);
    }

    return newArr;
  }

  private columnToRow(arr: string[][], column: number, cb: Function): void {
    const resultArr = [];
    const maxLength = Math.max(...arr.map((items: string[]) => items.length));

    for (let i = 0; i < maxLength; i++) {
      resultArr.push(...arr.map((item: string[]) => item[i]).filter((item: string) => item));
    }

    const residue = resultArr.length % column;
    const emptyArr = residue ? new Array(column - (resultArr.length % column)) : null;

    if (emptyArr) {
      resultArr.push(...emptyArr);
    }

    this.regionsLogic(resultArr, column, cb);
  }

  private regionsLogic(arr: string[], column: number, cb: Function): void {
    const resultArr = [];
    const newArrow = [];

    for (let i = 0; i < column; i++) {
      let getElementIndex = i;
      newArrow[i] = [];

      forEach(arr, (item: string, index: number) => {
        if (index === getElementIndex) {
          newArrow[i].push(item);
          getElementIndex += Number(column);
        }
      });
    }

    this.sortByRegionAndCountry(newArrow, 0, 'region', Number(column) - 1, (data, index: number) => {
      resultArr[index] = data;

      if (index === Number(column) - 1) {
        return cb(flattenDeep(zip(...resultArr)));
      }
    });
  }

  private sortByRegionAndCountry(arr: number[][], position: number, type: string, column: number, cb: Function): void {
    const good = [];
    const bad = [];
    const columnArr = compact(arr[position]);

    if (columnArr.length > 1) {
      reduce(columnArr, (previousValue, currentItem: number) => {
        if (!good.length) {
          good.push(previousValue);
        }

        if (previousValue[type] !== currentItem[type]) {
          good.push(currentItem);
        } else {
          bad.push(currentItem);
        }

        return currentItem;
      });
    } else {
      good.push(head(columnArr));
    }

    if (uniqBy(bad, 'region').length > 1) {
      arr[position] = good.concat(bad);
      this.sortByRegionAndCountry(arr, position, 'region', column, cb);

      return;
    }

    if (uniqBy(bad, 'country').length > 1) {
      arr[position] = good.concat(bad);
      this.sortByRegionAndCountry(arr, position, 'country', column, cb);

      return;
    }

    cb(good.concat(bad), position);

    if (position === column) {
      return;
    }

    // fix: calling this without setTimeout leads to Maximum call stack size exceeded
    setTimeout(this.sortByRegionAndCountry.bind(this, arr, position + 1, 'region', column, cb), 0);
  }
}
