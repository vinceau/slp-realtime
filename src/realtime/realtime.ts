import { SlpStream } from "../utils/slpStream";
import { StockEvents } from "../events/stocks";
import { InputEvents } from "../events/inputs";
import { ComboEvents } from "../events/combos";
import { GameEvents } from "../events/game";

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
  public game = new GameEvents();
  public stock = new StockEvents();
  public input = new InputEvents();
  public combo = new ComboEvents();

  /**
   * Starts listening to the provided stream for Slippi events
   *
   * @param {SlpStream} stream
   * @memberof SlpRealTime
   */
  public setStream(stream: SlpStream): void {
    this.game.setStream(stream);
    this.stock.setStream(stream);
    this.input.setStream(stream);
    this.combo.setStream(stream);
  }

}
