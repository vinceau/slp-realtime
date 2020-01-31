/* eslint-disable no-param-reassign */
import EventEmitter from "events";
import StrictEventEmitter from "strict-event-emitter-types";

import { SlpParser, GameStartType, GameEndType, Command, Stats as SlippiStats, ComboType, StockType, ConversionType, FrameEntryType, didLoseStock, PostFrameUpdateType, isDead } from "slp-parser-js";
import { StockComputer } from "../stats/stocks";
import { ComboComputer } from "../stats/combos";
import { ConversionComputer } from "../stats/conversions";
import { SlpStream } from "../utils/slpStream";
import { map, distinctUntilChanged, withLatestFrom, filter, pairwise, mapTo, switchMap } from "rxjs/operators";
import { Subscription, Observable } from "rxjs";
import { findWinner } from "../utils/helpers";
import { StockEvents } from "../events/stocks";

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

  private streamSubscriptions = new Array<Subscription>();
  private gameSubscriptions = new Array<Subscription>();

  public gameWinner$: Observable<number>;
  public stock: StockEvents;

  /**
   * Starts listening to the provided stream for Slippi events
   *
   * @param {SlpStream} stream
   * @memberof SlpRealTime
   */
  public setStream(stream: SlpStream): void {
    this._reset();
    this.stream = stream;
    const unsubGameStart = stream.gameStart$.subscribe(payload => {
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
    this.streamSubscriptions.push(unsubGameStart, unsubPreFrame, unsubPostFrame, unsubGameEnd);

    this.gameWinner$ = stream.gameEnd$.pipe(
      withLatestFrom(stream.playerFrame$),
      map(([_, playerFrame]) => findWinner(playerFrame)),
    );
    this.stock = new StockEvents();
    this.stock.setStream(stream);
  }

  public playerInputs(index: number, controlBitMask: number): Observable<number> {
    if (!this.stream) {
      throw new Error("No stream to subscribe to");
    }
    return this.stream.playerFrame$.pipe(
      map(f => f.players[index].pre.physicalButtons & controlBitMask),
      distinctUntilChanged(),
      filter(n => n === controlBitMask),
    );
  }

  public playerPercentChange(index: number): Observable<number> {
    if (!this.stream) {
      throw new Error("No stream to subscribe to");
    }
    return this.stream.playerFrame$.pipe(
      map(f => f.players[index].post.percent),
      distinctUntilChanged(),
    );
  }

  /**
   * Emits an event each time player dies. The payload emitted is the player index.
   */
  public playerSpawn(index: number): Observable<StockType> {
    if (!this.stream) {
      throw new Error("No stream to subscribe to");
    }
    return this.stream.playerFrame$.pipe(
      map(f => f.players[index].post),  // Only take the post frame data
      pairwise(),                       // We want both the latest frame and the previous frame
      filter(([prevFrame, latestFrame]) =>
        latestFrame.frame > prevFrame.frame    // So we don't mix up frames between games
        && isDead(prevFrame.actionStateId)     // We only care about the frames where we just spawned
        && !isDead(latestFrame.actionStateId)
      ),
      map(([_, latestFrame]) => {
        return {
          playerIndex: latestFrame.playerIndex,
          opponentIndex: -1, // FIXME: figure out how to get the opponent index
          startFrame: latestFrame.frame,
          endFrame: null,
          startPercent: 0,
          endPercent: null,
          currentPercent: 0,
          count: latestFrame.stocksRemaining,
          deathAnimation: null,
        };
      }),
    );
  }

  /**
   * Emits an event each time player dies. The payload emitted is the player index.
   */
  public playerDied(index: number): Observable<number> {
    return this.stream.playerFrame$.pipe(
      map(f => f.players[index].post),  // Only take the post frame data
      pairwise(),                       // We want both the latest frame and the previous frame
      // We make sure that the latest frame is strictly greater than the previous frame
      // in the case where a new game starts, we don't want the previous frame to be that of
      // the last game.
      // And then we check if the player lost a stock.
      filter(([prevFrame, latestFrame]) => latestFrame.frame > prevFrame.frame && didLoseStock(latestFrame, prevFrame)),
      mapTo(index),  // Return the player index
    );
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
      this.streamSubscriptions.forEach(s => s.unsubscribe());
      this.streamSubscriptions = [];
    }
    // Reset the stream and the parser
    this.stream = null;
    this.parser = null;
  }

  private _setupStats(payload: GameStartType): SlpParser {
    // Clean up old subscriptions
    this.gameSubscriptions.forEach(s => s.unsubscribe());
    this.gameSubscriptions = [];

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
    this.gameSubscriptions.push(
      combo.comboStart$.subscribe((c) => {
        this.emit("comboStart", c, payload);
      }),
      combo.comboExtend$.subscribe((c) => {
        this.emit("comboExtend", c, payload);
      }),
      combo.comboEnd$.subscribe((c) => {
        this.emit("comboEnd", c, payload);
      }),
    );
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
