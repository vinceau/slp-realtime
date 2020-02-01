import { SlpStream } from "../utils/slpStream";
import { map, distinctUntilChanged } from "rxjs/operators";
import { Observable, merge } from "rxjs";
import { playerFilter } from "../operators/frames";

// Export the parameter types for events
export { GameStartType, GameEndType, ComboType, StockType, ConversionType } from "slp-parser-js";

export interface ButtonComboPayload {
  playerIndex: number;
  buttonCombo: number;
}

export class InputEvents {
  protected stream: SlpStream | null = null;

  public playerButtonCombo$: Observable<ButtonComboPayload>;

  /**
   * Starts listening to the provided stream for Slippi events
   *
   * @param {SlpStream} stream
   * @memberof SlpRealTime
   */
  public setStream(stream: SlpStream): void {
    this.stream = stream;
    this.playerButtonCombo$ = merge(
      this.playerIndexButtonCombo(0),
      this.playerIndexButtonCombo(1),
      this.playerIndexButtonCombo(2),
      this.playerIndexButtonCombo(3),
    );
  }

  public playerIndexButtonCombo(index: number): Observable<ButtonComboPayload> {
    if (!this.stream) {
      throw new Error("No stream to subscribe to");
    }

    return this.stream.playerFrame$.pipe(
      playerFilter(index),
      map(f => f.players[index].pre.physicalButtons),
      distinctUntilChanged(),
      map(buttonCombo  => ({
        playerIndex: index,
        buttonCombo,
      })),
    );
  }

}
