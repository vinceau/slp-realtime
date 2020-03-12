import { SlpStream } from "../utils/slpStream";
import { map, scan, filter, mapTo } from "rxjs/operators";
import { Observable, Subject, Subscription } from "rxjs";
import { playerFilter } from "../operators/frames";
import { forAllPlayerIndices } from "../utils/helpers";
import { ControllerInput } from "../types";
import { generateControllerBitmask } from "../utils";

// Export the parameter types for events
export { GameStartType, GameEndType, ComboType, StockType, ConversionType } from "slp-parser-js";

export interface ButtonComboPayload {
  playerIndex: number;
  buttonCombo: number;
}

export class InputEvents {
  protected stream: SlpStream | null = null;
  private subscriptions = new Array<Subscription>();
  private playerButtonComboSource$ = new Subject<ButtonComboPayload>();
  public playerButtonCombo$ = this.playerButtonComboSource$.asObservable();

  /**
   * Starts listening to the provided stream for Slippi events
   *
   * @param {SlpStream} stream
   * @memberof SlpRealTime
   */
  public setStream(stream: SlpStream): void {
    // Clear previous subscriptions
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];

    this.stream = stream;

    this.subscriptions.push(
      forAllPlayerIndices(i => this.playerIndexButtonCombo(i)).subscribe(this.playerButtonComboSource$),
    );
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
    if (!this.stream) {
      throw new Error("No stream to subscribe to");
    }

    const controlBitMask = generateControllerBitmask(...buttons);
    return this.stream.playerFrame$.pipe(
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
