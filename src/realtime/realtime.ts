import { SlpStream } from "../stream";
import { StockEvents, InputEvents, ComboEvents, GameEvents } from "../events";
import { ReplaySubject } from "rxjs";

/**
 * SlpRealTime is solely responsible for detecting notable in-game events
 * and emitting an appropriate event.
 *
 * @export
 * @class SlpRealTime
 * @extends {EventEmitter}
 */
export class SlpRealTime {
  private stream$ = new ReplaySubject<SlpStream>();

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
  public setStream(stream: SlpStream): void {
    this.stream$.next(stream);
  }
}
