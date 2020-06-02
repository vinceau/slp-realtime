import { InputButtonCombo } from "../types";
import { Observable, MonoTypeOperatorFunction } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";

/**
 * Throttle inputs for a number of frames
 */
export function throttleInputButtons(frames: number): MonoTypeOperatorFunction<InputButtonCombo> {
  return (source: Observable<InputButtonCombo>): Observable<InputButtonCombo> => source.pipe(
    distinctUntilChanged((prev, curr) => {
      // Should we discard this value?
      // Discard if the current frame is still within the lockout duration
      return curr.frame < prev.frame + frames;
    }),
  );
}
