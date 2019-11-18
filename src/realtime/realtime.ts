/* eslint-disable no-param-reassign */
import EventEmitter from "events";
import { SlpStream, SlpEvent } from '../utils/slpStream';
import { SlpParser, GameStartType, GameEndType, Command, PostFrameUpdateType, Stats as SlippiStats, StatComputer } from "slp-parser-js";
import { SlpFileWriter } from "../utils/slpWriter";
import { ConsoleConnection } from "@vinceau/slp-wii-connect"
import { StockComputer } from "../stats/stocks";
import { ComboComputer } from "../stats/combos";

export interface SlippiRealtimeOptions {
  address: string;
  port: number;
  writeSlpFiles: boolean;
  writeSlpFileLocation: string;
}

/**
 * Slippi Game class that wraps a read stream
 */
export class SlippiRealtime extends EventEmitter {
  private stream: SlpStream;
  private parser: SlpParser;
  private connection: ConsoleConnection;
  private options: SlippiRealtimeOptions;

  public constructor(options: SlippiRealtimeOptions) {
    super();
    this.options = options;
    this.stream = new SlpFileWriter({
      outputFiles: options.writeSlpFiles,
      folderPath: options.writeSlpFileLocation,
    });
    this.connection = new ConsoleConnection(this.options.address, this.options.port);
    this.connection.connect();
    this.connection.on("data", (data) => {
      this.stream.write(data);
    });
  }

  public start(): void {
    this.stream.on(SlpEvent.GAME_START, (command: Command, payload: GameStartType) => {
      this.parser = this._setupStats();
      this.parser.handleGameStart(payload);
      this.emit("gameStart");
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
      this.emit("gameEnd");
    });
  }

  private _setupStats(): SlpParser {
    const s = new SlippiStats({
      processOnTheFly: true,
    });
    const stock = new StockComputer();
    stock.on('spawn', () => {
      this.emit('spawn');
    });
    stock.on('death', () => {
      this.emit('death');
    });
    const combo = new ComboComputer();
    combo.on("comboStart", () => {
      this.emit("comboStart");
    });
    combo.on("comboExtend", () => {
      this.emit("comboExtend");
    });
    combo.on("comboEnd", () => {
      this.emit("comboEnd");
    });
    s.registerAll([
      stock,
      combo,
    ]);
    return new SlpParser(s);
  }
}