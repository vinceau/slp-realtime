import { SlpStream } from "../utils/slpStream";
import { map, filter, distinctUntilChanged, mapTo } from "rxjs/operators";
import { Observable, merge } from "rxjs";
import { playerFilter } from "../operators/frames";

// Export the parameter types for events
export { GameStartType, GameEndType, ComboType, StockType, ConversionType } from "slp-parser-js";

export class InputEvents {
  protected stream: SlpStream | null = null;

  /**
   * Starts listening to the provided stream for Slippi events
   *
   * @param {SlpStream} stream
   * @memberof SlpRealTime
   */
  public setStream(stream: SlpStream): void {
    this.stream = stream;
  }

  public playerButtonCombo(controlBitMask: number): Observable<number> {
    if (!this.stream) {
      throw new Error("No stream to subscribe to");
    }

    return merge(
      this.playerIndexButtonCombo(0, controlBitMask),
      this.playerIndexButtonCombo(1, controlBitMask),
      this.playerIndexButtonCombo(2, controlBitMask),
      this.playerIndexButtonCombo(3, controlBitMask),
    );
  }

  public playerIndexButtonCombo(index: number, controlBitMask: number): Observable<number> {
    if (!this.stream) {
      throw new Error("No stream to subscribe to");
    }

    return this.stream.playerFrame$.pipe(
      playerFilter(index),
      map(f => f.players[index].pre.physicalButtons & controlBitMask),
      distinctUntilChanged(),
      filter(n => n === controlBitMask),
      mapTo(index),
    );
  }

}
