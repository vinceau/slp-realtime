/* eslint-disable no-param-reassign */
import EventEmitter from "events";
import StrictEventEmitter from 'strict-event-emitter-types';

import { SlpStream, SlpEvent } from '../utils/slpStream';
import { SlpParser, GameStartType, GameEndType, Command, PostFrameUpdateType, Stats as SlippiStats } from "slp-parser-js";
import { SlpFileWriter } from "../utils/slpWriter";
import { ConsoleConnection, ConnectionStatus } from "@vinceau/slp-wii-connect"
import { StockComputer, StockComputerEvents } from "../stats/stocks";
import { ComboComputer, ComboComputerEvents } from "../stats/combos";
import { promiseTimeout } from "../utils/sleep";

export { ConnectionStatus } from "@vinceau/slp-wii-connect";

const SLIPPI_CONNECTION_TIMEOUT_MS = 5000;

export interface SlippiRealtimeOptions {
  writeSlpFiles: boolean;
  writeSlpFileLocation: string;
}

interface SlippiRealtimeEvents extends StockComputerEvents, ComboComputerEvents {
  gameStart: GameStartType;
  gameEnd: GameEndType;
  statusChange: ConnectionStatus;
}

type SlippiRealtimeEventEmitter = { new(): StrictEventEmitter<EventEmitter, SlippiRealtimeEvents> };

/**
 * Slippi Game class that wraps a read stream
 */
export class SlippiRealtime extends (EventEmitter as SlippiRealtimeEventEmitter) {
  private stream: SlpStream;
  private parser: SlpParser;
  private connection: ConsoleConnection;

  public constructor(options: SlippiRealtimeOptions) {
    super();
    this.stream = new SlpFileWriter({
      outputFiles: options.writeSlpFiles,
      folderPath: options.writeSlpFileLocation,
    });
    this.stream.on(SlpEvent.GAME_START, (command: Command, payload: GameStartType) => {
      this.parser = this._setupStats();
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

  public async start(address: string, port: number): Promise<boolean> {
    const assertConnected = new Promise<boolean>((resolve, reject): void => {
      try {
        this.connection = new ConsoleConnection(address, port);
        this.connection.connect(SLIPPI_CONNECTION_TIMEOUT_MS);
        this.connection.on("data", (data) => {
          this.stream.write(data);
        });
        this.connection.on("statusChange", (status: ConnectionStatus) => {
          this.emit("statusChange", status);
        });
        this.connection.once("statusChange", (status: ConnectionStatus) => {
          switch (status) {
          case ConnectionStatus.CONNECTED:
            resolve(true);
            break;
          case ConnectionStatus.DISCONNECTED:
            reject(`Failed to connect to: ${address}:${port}`);
            break;
          }
        });
      } catch (err) {
        reject(err);
      }
    });
    return promiseTimeout<boolean>(SLIPPI_CONNECTION_TIMEOUT_MS, assertConnected);
  }

  public getConnectionStatus(): ConnectionStatus {
    if (this.connection) {
      return this.connection.getStatus();
    }
    return ConnectionStatus.DISCONNECTED;
  }

  private _setupStats(): SlpParser {
    const s = new SlippiStats({
      processOnTheFly: true,
    });
    const stock = new StockComputer();
    stock.on('spawn', (s) => {
      this.emit('spawn', s);
    });
    stock.on('death', (s) => {
      this.emit('death', s);
    });
    const combo = new ComboComputer();
    combo.on("comboStart", (c) => {
      this.emit("comboStart", c);
    });
    combo.on("comboExtend", (c) => {
      this.emit("comboExtend", c);
    });
    combo.on("comboEnd", (c) => {
      this.emit("comboEnd", c);
    });
    s.registerAll([
      stock,
      combo,
    ]);
    return new SlpParser(s);
  }
}