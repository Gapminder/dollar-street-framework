import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators/map';

export class StoreMock<T> {
  private state: BehaviorSubject<T> = new BehaviorSubject(undefined);

  setState(data) {
    this.state.next(data);
  }

  dispatch(action) {
  }

  select(selector?: any): Observable<T> {
    return this.state.pipe(map(selector));
  }
}
