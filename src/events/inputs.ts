import { SlpStream } from "../utils/slpStream";
import { map, distinctUntilChanged } from "rxjs/operators";
import { Observable, Subject, Subscription } from "rxjs";
import { playerFilter } from "../operators/frames";
import { forAllPlayerIndices } from "../utils/helpers";

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
      forAllPlayerIndices(this.playerIndexButtonCombo).subscribe(this.playerButtonComboSource$),
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
