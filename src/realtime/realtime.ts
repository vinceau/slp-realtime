import { SlpStream } from "../utils/slpStream";
import { StockEvents } from "../events/stocks";
import { InputEvents } from "../events/inputs";
import { ComboEvents } from "../events/combos";
import { GameEvents } from "../events/game";
import { ReplaySubject } from "rxjs";

// Export the parameter types for events
export { GameStartType, GameEndType, ComboType, StockType, ConversionType } from "slp-parser-js";

/**
 * SlpRealTime is solely responsible for detecting notable in-game events
 * and emitting an appropriate event.
 *
 * @export
 * @class SlpRealTime
 * @extends {EventEmitter}
 */
export class SlpRealTime {
  private streamSource = new ReplaySubject<SlpStream>();
  private stream$ = this.streamSource.asObservable();

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
    this.streamSource.next(stream);
  }

}
