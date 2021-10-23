import { ReplaySubject } from "rxjs";

import { ComboEvents, GameEvents, InputEvents, StockEvents } from "../events";
import type { RxSlpStream } from "../stream";

/**
 * SlpRealTime is solely responsible for detecting notable in-game events
 * and emitting an appropriate event.
 *
 * @export
 * @class SlpRealTime
 * @extends {EventEmitter}
 */
export class SlpRealTime {
  private stream$ = new ReplaySubject<RxSlpStream>();

  public game: GameEvents;
  public stock: StockEvents;
  public input: InputEvents;
  public combo: ComboEvents;

  public constructor() {
    this.game = new GameEvents(this.stream$);
    this.stock = new StockEvents(this.stream$);
    this.input = new InputEvents(this.stream$);
    this.combo = new ComboEvents(this.stream$);
  }

  /**
   * Starts listening to the provided stream for Slippi events
   *
   * @param {SlpStream} stream
   * @memberof SlpRealTime
   */
  public setStream(stream: RxSlpStream): void {
    this.stream$.next(stream);
  }
}
