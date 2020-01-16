/* eslint-disable no-param-reassign */
import EventEmitter from "events";
import StrictEventEmitter from "strict-event-emitter-types";

import { SlpStream, SlpEvent } from "../utils/slpStream";
import { SlpParser, GameStartType, GameEndType, Command, PostFrameUpdateType, Stats as SlippiStats, ComboType, StockType, ConversionType } from "slp-parser-js";
import { StockComputer } from "../stats/stocks";
import { ComboComputer } from "../stats/combos";
import { ConversionComputer } from "../stats/conversions";

// Export the parameter types for events
export { GameStartType, GameEndType, ComboType, StockType } from "slp-parser-js";

interface SlpRealTimeEvents {
  gameStart: GameStartType;
  gameEnd: GameEndType;
  comboStart: (combo: ComboType, settings: GameStartType) => void;
  comboExtend: (combo: ComboType, settings: GameStartType) => void;
  comboEnd: (combo: ComboType, settings: GameStartType) => void;
  conversion: (conversion: ConversionType, settings: GameStartType) => void;
  spawn: (playerIndex: number, stock: StockType, settings: GameStartType) => void;
  death: (playerIndex: number, stock: StockType, settings: GameStartType) => void;
  percentChange: (playerIndex: number, percent: number) => void;
}

type SlpRealTimeEventEmitter = { new(): StrictEventEmitter<EventEmitter, SlpRealTimeEvents> };

/**
 * SlpRealTime is solely responsible for detecting notable in-game events
 * and emitting an appropriate event.
 *
 * @export
 * @class SlpRealTime
 * @extends {EventEmitter}
 */
export class SlpRealTime extends (EventEmitter as SlpRealTimeEventEmitter) {
  protected stream: SlpStream | null;
  protected parser: SlpParser | null;

  private gameStartHandler: (command: Command, payload: GameStartType) => void;
  private preFrameHandler: (command: Command, payload: PostFrameUpdateType) => void;
  private postFrameHandler: (command: Command, payload: PostFrameUpdateType) => void;
  private gameEndHandler: (command: Command, payload: GameEndType) => void;

  public constructor() {
    super();
    this.stream = null;
    this.parser = null;
    this.gameStartHandler = (command, payload): void => {
      this.parser = this._setupStats(payload);
      this.parser.handleGameStart(payload);
      this.emit("gameStart", payload);
    };
    this.preFrameHandler = (command, payload): void => {
      if (this.parser) {
        this.parser.handleFrameUpdate(command, payload);
      }
    };
    this.postFrameHandler = (command, payload): void => {
      if (this.parser) {
        this.parser.handlePostFrameUpdate(payload);
        this.parser.handleFrameUpdate(command, payload);
      }
    };
    this.gameEndHandler = (command, payload): void => {
      if (this.parser) {
        this.parser.handleGameEnd(payload);
        this.emit("gameEnd", payload);
      }
    };
  }

  /**
   * Starts listening to the provided stream for Slippi events
   *
   * @param {SlpStream} stream
   * @memberof SlpRealTime
   */
  public setStream(stream: SlpStream): void {
    this._reset();
    this.stream = stream;
    this.stream.on(SlpEvent.GAME_START, this.gameStartHandler);
    this.stream.on(SlpEvent.PRE_FRAME_UPDATE, this.preFrameHandler);
    this.stream.on(SlpEvent.POST_FRAME_UPDATE, this.postFrameHandler);
    this.stream.on(SlpEvent.GAME_END, this.gameEndHandler);
  }

  /**
   * Unsubscribes from the previous stream so we won't keep emitting events.
   * Resets the stream and parser to null.
   *
   * @private
   * @memberof SlpRealTime
   */
  private _reset(): void {
    if (this.stream) {
      this.stream.removeListener(SlpEvent.GAME_START, this.gameStartHandler);
      this.stream.removeListener(SlpEvent.PRE_FRAME_UPDATE, this.preFrameHandler);
      this.stream.removeListener(SlpEvent.POST_FRAME_UPDATE, this.postFrameHandler);
      this.stream.removeListener(SlpEvent.GAME_END, this.gameEndHandler);
    }
    // Reset the stream and the parser
    this.stream = null;
    this.parser = null;
  }

  private _setupStats(payload: GameStartType): SlpParser {
    const stats = new SlippiStats({
      processOnTheFly: true,
    });
    const stock = new StockComputer();
    stock.on("percentChange", (i: number, percent: number) => {
      this.emit("percentChange", i, percent);
    });
    stock.on("spawn", (i, s) => {
      this.emit("spawn", i, s, payload);
    });
    stock.on("death", (i, s) => {
      this.emit("death", i, s, payload);
    });
    const combo = new ComboComputer();
    combo.on("comboStart", (c) => {
      this.emit("comboStart", c, payload);
    });
    combo.on("comboExtend", (c) => {
      this.emit("comboExtend", c, payload);
    });
    combo.on("comboEnd", (c) => {
      this.emit("comboEnd", c, payload);
    });
    const conversion = new ConversionComputer();
    conversion.on("conversion", (c) => {
      this.emit("conversion", c, payload);
    });
    stats.registerAll([
      stock,
      combo,
    ]);
    return new SlpParser(stats);
  }
}
