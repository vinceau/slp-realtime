import { Observable } from "rxjs";

import { SlpStream } from "../utils/rxSlpStream";
import { SlpParser, GameStartType, GameEndType, Command, PostFrameUpdateType, Stats as SlippiStats } from "slp-parser-js";

// Export the parameter types for events
export { GameStartType, GameEndType, ComboType, StockType, ConversionType } from "slp-parser-js";

// gameStart: GameStartType;
// gameEnd: GameEndType;
// comboStart: (combo: ComboType, settings: GameStartType) => void;
// comboExtend: (combo: ComboType, settings: GameStartType) => void;
// comboEnd: (combo: ComboType, settings: GameStartType) => void;
// conversion: (conversion: ConversionType, settings: GameStartType) => void;
// spawn: (playerIndex: number, stock: StockType, settings: GameStartType) => void;
// death: (playerIndex: number, stock: StockType, settings: GameStartType) => void;
// percentChange: (playerIndex: number, percent: number) => void;

/**
 * SlpRealTime is solely responsible for detecting notable in-game events
 * and emitting an appropriate event.
 *
 * @export
 * @class SlpRealTime
 * @extends {EventEmitter}
 */
export class RxSlpRealTime {
  protected stream: SlpStream | null = null;
  // protected parser: SlpParser | null;

  public gameStart$: Observable<GameStartType>;
  public gameEnd$: Observable<GameEndType>;

  /**
   * Starts listening to the provided stream for Slippi events
   *
   * @param {SlpStream} stream
   * @memberof SlpRealTime
   */
  public setStream(stream: SlpStream): void {
    /*
    this._reset();
    this.stream = stream;
    this.stream.on(SlpEvent.GAME_START, this.gameStartHandler);
    this.stream.on(SlpEvent.PRE_FRAME_UPDATE, this.preFrameHandler);
    this.stream.on(SlpEvent.POST_FRAME_UPDATE, this.postFrameHandler);
    this.stream.on(SlpEvent.GAME_END, this.gameEndHandler);
    */
    this.gameStart$ = stream.gameStart$;
    this.gameEnd$ = stream.gameEnd$;
  }

}
