/* eslint-disable no-param-reassign */
import EventEmitter from "events";
import StrictEventEmitter from "strict-event-emitter-types";

import { SlpStream, SlpEvent } from "../utils/slpStream";
import { SlpParser, GameStartType, GameEndType, Command, PostFrameUpdateType, Stats as SlippiStats, ComboType, StockType } from "slp-parser-js";
import { StockComputer } from "../stats/stocks";
import { ComboComputer } from "../stats/combos";

// Export the parameter types for events
export { GameStartType, GameEndType, ComboType, StockType } from "slp-parser-js";

interface SlippiRealtimeEvents {
  gameStart: GameStartType;
  gameEnd: GameEndType;
  comboStart: (combo: ComboType, settings: GameStartType) => void;
  comboExtend: (combo: ComboType, settings: GameStartType) => void;
  comboEnd: (combo: ComboType, settings: GameStartType) => void;
  spawn: (playerIndex: number, stock: StockType, settings: GameStartType) => void;
  death: (playerIndex: number, stock: StockType, settings: GameStartType) => void;
  percentChange: (playerIndex: number, percent: number) => void;
}

type SlippiRealtimeEventEmitter = { new(): StrictEventEmitter<EventEmitter, SlippiRealtimeEvents> };

/**
 * SlippiRealtime is solely responsible for detecting notable in-game events
 * and emitting an appropriate event.
 */
export class SlippiRealtime extends (EventEmitter as SlippiRealtimeEventEmitter) {
  protected stream: SlpStream;
  protected parser: SlpParser;

  public constructor(stream: SlpStream) {
    super();
    this.stream = stream;
    this.stream.on(SlpEvent.GAME_START, (command: Command, payload: GameStartType) => {
      this.parser = this._setupStats(payload);
      this.parser.handleGameStart(payload);
      this.emit("gameStart", payload);
    });

    this.stream.on(SlpEvent.PRE_FRAME_UPDATE, (command: Command, payload: PostFrameUpdateType) => {
      this.parser.handleFrameUpdate(command, payload);
    });

    this.stream.on(SlpEvent.POST_FRAME_UPDATE, (command: Command, payload: PostFrameUpdateType) => {
      this.parser.handlePostFrameUpdate(payload);
      this.parser.handleFrameUpdate(command, payload);
    });

    this.stream.on(SlpEvent.GAME_END, (command: Command, payload: GameEndType) => {
      this.parser.handleGameEnd(payload);
      this.emit("gameEnd", payload);
    });
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
    stats.registerAll([
      stock,
      combo,
    ]);
    return new SlpParser(stats);
  }
}
