/* eslint-disable no-param-reassign */
import EventEmitter from "events";
import StrictEventEmitter from "strict-event-emitter-types";

import { SlpParser, GameStartType, GameEndType, Command, Stats as SlippiStats, ComboType, StockType, ConversionType } from "slp-parser-js";
import { StockComputer } from "../stats/stocks";
import { ComboComputer } from "../stats/combos";
import { ConversionComputer } from "../stats/conversions";
import { SlpStream } from "../utils/slpStream";
import { map, tap } from "rxjs/operators";
import { Subscription } from "rxjs";

// Export the parameter types for events
export { GameStartType, GameEndType, ComboType, StockType, ConversionType } from "slp-parser-js";

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
  protected stream: SlpStream | null = null;
  protected parser: SlpParser | null = null;

  private subscriptions = new Array<Subscription>();

  /**
   * Starts listening to the provided stream for Slippi events
   *
   * @param {SlpStream} stream
   * @memberof SlpRealTime
   */
  public setStream(stream: SlpStream): void {
    this._reset();
    this.stream = stream;
    const unsubGameStart = stream.gameStart$
      .pipe<GameStartType>(
      // We want to filter out the empty players
      map(data => ({
        ...data,
        players: data.players.filter(p => p.type !== 3),
      })),
    )
      .subscribe(payload => {
        this.parser = this._setupStats(payload);
        this.parser.handleGameStart(payload);
        this.emit("gameStart", payload);
      });
    const unsubPreFrame = stream.preFrameUpdate$.subscribe(payload => {
      if (this.parser) {
        this.parser.handleFrameUpdate(Command.PRE_FRAME_UPDATE, payload);
      }
    });
    const unsubPostFrame = stream.postFrameUpdate$.subscribe(payload => {
      if (this.parser) {
        this.parser.handlePostFrameUpdate(payload);
        this.parser.handleFrameUpdate(Command.POST_FRAME_UPDATE, payload);
      }
    });
    const unsubGameEnd = stream.gameEnd$.subscribe(payload => {
      if (this.parser) {
        this.parser.handleGameEnd(payload);
        this.emit("gameEnd", payload);
      }
    });
    this.subscriptions.push(unsubGameStart, unsubPreFrame, unsubPostFrame, unsubGameEnd);
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
      this.subscriptions.forEach(s => s.unsubscribe());
      this.subscriptions = [];
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
      conversion,
    ]);
    return new SlpParser(stats);
  }
}
