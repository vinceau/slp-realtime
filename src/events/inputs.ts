import { Observable } from "rxjs";
import { map, scan, filter, switchMap } from "rxjs/operators";
import { Frames } from "slp-parser-js";

import { SlpStream } from "../utils/slpStream";
import { playerFrameFilter } from "../operators/frames";
import { Input, InputButtonCombo } from "../types";
import { generateInputBitmask } from "../utils";
import { forAllPlayerIndices } from "../utils/helpers";

// Export the parameter types for events
export { GameStartType, GameEndType, ComboType, StockType, ConversionType } from "slp-parser-js";

export class InputEvents {
  private stream$: Observable<SlpStream>;

  public constructor(stream: Observable<SlpStream>) {
    this.stream$ = stream;
  }

  public buttonCombo(buttons: Input[], duration?: number): Observable<InputButtonCombo> {
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
  public playerIndexButtonCombo(index: number, buttons: Input[], duration = 1): Observable<InputButtonCombo> {
    const controlBitMask = generateInputBitmask(...buttons);
    return this.stream$.pipe(
      // Get the player frames
      switchMap(stream => stream.playerFrame$),
      // Filter for the specific player
      playerFrameFilter(index),
      // Map the frames to whether the button combination was pressed or not
      // while tracking the frame number
      map((f): {
        frame: number;
        buttonPressed: boolean;
      } => {
        const buttonCombo = f.players[index].pre.physicalButtons;
        const buttonComboPressed = (buttonCombo & controlBitMask) === controlBitMask;
        return {
          frame: f.frame,
          buttonPressed: buttonComboPressed,
        };
      }),
      // Count the number of consecutively pressed frames
      scan((acc, data) => {
        const count = data.buttonPressed ? acc.count + 1 : 0;
        return {
          count,
          frame: data.frame,
        };
      }, {
        count: 0,
        frame: Frames.FIRST,
      }),
      // Filter to be the exact frame when we pressed the combination for sufficient frames
      filter(n => n.count === duration),
      // Return the player index which triggered the button press
      map(data => ({
        playerIndex: index,
        combo: buttons,
        frame: data.frame,
        duration,
      })),
    );
  }
}
