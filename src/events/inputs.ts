import { SlpStream } from "../utils/slpStream";
import { map, scan, filter, mapTo, switchMap } from "rxjs/operators";
import { Observable } from "rxjs";
import { playerFilter } from "../operators/frames";
import { ControllerInput } from "../types";
import { generateControllerBitmask } from "../utils";
import { forAllPlayerIndices } from "../utils/helpers";

// Export the parameter types for events
export { GameStartType, GameEndType, ComboType, StockType, ConversionType } from "slp-parser-js";

export class InputEvents {
  private stream$: Observable<SlpStream>;

  public constructor(stream: Observable<SlpStream>) {
    this.stream$ = stream;
  }

  public buttonCombo(buttons: ControllerInput[], duration?: number): Observable<number> {
    return forAllPlayerIndices(i => this.playerIndexButtonCombo(i, buttons, duration));
  }

  /**
   * Returns an observable which emits when `buttons` is held for `duration` number of frames.
   *
   * @param {number} index The player index
   * @param {number} buttons The button combination
   * @param {number} duration The number of frames the buttons were held for
   * @returns {Observable<number>}
   * @memberof InputEvents
   */
  public playerIndexButtonCombo(index: number, buttons: ControllerInput[], duration = 1): Observable<number> {
    const controlBitMask = generateControllerBitmask(...buttons);
    return this.stream$.pipe(
      switchMap(stream => stream.playerFrame$),
      playerFilter(index),
      // Map the frames to whether the button combination was pressed or not
      map(f => {
        const buttonCombo = f.players[index].pre.physicalButtons;
        const buttonComboPressed = (buttonCombo & controlBitMask) === controlBitMask;
        return buttonComboPressed;
      }),
      // Count the number of consecutively pressed frames
      scan((acc, pressed) => {
        if (pressed) {
          return acc + 1;
        }
        return 0;
      }, 0),
      // Filter to be the exact frame when we pressed the combination for sufficient frames
      filter(n => n === duration),
      // Return the player index which triggered the button press
      mapTo(index),
    );
  }

}
