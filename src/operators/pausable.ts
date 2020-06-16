import { Observable, MonoTypeOperatorFunction } from "rxjs";
import { repeatWhen, takeUntil } from "rxjs/operators";

/**
 * Return the previous frame of the game and the current frame
 */
export function pausable<T>(stop: Observable<any>, restart: Observable<any>): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>): Observable<T> =>
    source.pipe(
      takeUntil(stop),
      repeatWhen(() => restart),
    );
}
