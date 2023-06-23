import { ReplaySubject } from "rxjs";

import { RealTimeComboEvents, RealTimeGameEvents, RealTimeInputEvents, RealTimeStockEvents } from "../events";
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

  public game: RealTimeGameEvents;
  public stock: RealTimeStockEvents;
  public input: RealTimeInputEvents;
  public combo: RealTimeComboEvents;

  public constructor() {
    this.game = new RealTimeGameEvents(this.stream$);
    this.stock = new RealTimeStockEvents(this.stream$);
    this.input = new RealTimeInputEvents(this.stream$);
    this.combo = new RealTimeComboEvents(this.stream$);
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
