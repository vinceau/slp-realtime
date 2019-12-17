/* eslint-disable no-param-reassign */
import EventEmitter from "events";
import StrictEventEmitter from 'strict-event-emitter-types';

import { SlpStream, SlpEvent } from '../utils/slpStream';
import { SlpParser, GameStartType, GameEndType, Command, PostFrameUpdateType, Stats as SlippiStats, ComboType, StockType } from "slp-parser-js";
import { StockComputer } from "../stats/stocks";
import { ComboComputer } from "../stats/combos";
import { CharacterComputer } from "../stats/character";

interface SlippiRealtimeEvents {
  gameStart: GameStartType;
  gameEnd: GameEndType;
  comboStart: (combo: ComboType, settings: GameStartType) => void;
  comboExtend: (combo: ComboType, settings: GameStartType) => void;
  comboEnd: (combo: ComboType, settings: GameStartType) => void;
  spawn: (stock: StockType, settings: GameStartType) => void;
  death: (stock: StockType, settings: GameStartType) => void;
  percentChange: (playerIndex: number, percent: number) => void;
}

type SlippiRealtimeEventEmitter = { new(): StrictEventEmitter<EventEmitter, SlippiRealtimeEvents> };

/**
 * Slippi Game class that wraps a read stream
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
    const character = new CharacterComputer();
    character.on('percentChange', (index: number, percent: number) => {
      this.emit('percentChange', index, percent);
    });
    const stock = new StockComputer();
    stock.on('spawn', (s) => {
      this.emit('spawn', s, payload);
    });
    stock.on('death', (s) => {
      this.emit('death', s, payload);
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
      character,
      stock,
      combo,
    ]);
    return new SlpParser(stats);
  }
}
