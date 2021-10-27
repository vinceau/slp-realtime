import { didLoseStock } from "@slippi/slippi-js";
import type { Observable } from "rxjs";
import { distinctUntilChanged, filter, map, switchMap } from "rxjs/operators";

import { playerFrameFilter, withPreviousFrame } from "../operators/frames";
import { filterJustSpawned, mapFramesToDeathStockType, mapFrameToSpawnStockType } from "../operators/stocks";
import type { RxSlpStream } from "../stream";
import type { PercentChange, StockCountChange, StockType } from "../types";
import { forAllPlayerIndices } from "../utils";
import { exists } from "../utils/exists";

export class RealTimeStockEvents {
  private stream$: Observable<RxSlpStream>;

  public playerSpawn$: Observable<StockType>;
  public playerDied$: Observable<StockType>;
  public percentChange$: Observable<PercentChange>;
  public countChange$: Observable<StockCountChange>;

  public constructor(stream: Observable<RxSlpStream>) {
    this.stream$ = stream;

    this.playerSpawn$ = forAllPlayerIndices((i) => this.playerIndexSpawn(i));
    this.playerDied$ = forAllPlayerIndices((i) => this.playerIndexDied(i));
    this.percentChange$ = forAllPlayerIndices((i) => this.playerIndexPercentChange(i));
    this.countChange$ = forAllPlayerIndices((i) => this.playerIndexStockCountChange(i));
  }

  /**
   * Emits an event each time player spawns.
   */
  public playerIndexSpawn(index: number): Observable<StockType> {
    return this.stream$.pipe(
      switchMap((stream) =>
        stream.playerFrame$.pipe(
          filterJustSpawned(index), // Only take the spawn frames
          map((f) => f.players[index]?.post), // Only take the post frame data
          filter(exists),
          mapFrameToSpawnStockType(stream.gameStart$, index), // Map the frame to StockType
        ),
      ),
    );
  }

  /**
   * Emits an event each time player dies.
   */
  public playerIndexDied(index: number): Observable<StockType> {
    return this.stream$.pipe(
      switchMap((stream) => stream.playerFrame$),
      playerFrameFilter(index), // We only care about certain player frames
      map((f) => f.players[index]?.post), // Only take the post frame data
      filter(exists),
      withPreviousFrame(), // Get previous frame too
      filter(
        ([prevFrame, latestFrame]) => didLoseStock(latestFrame, prevFrame), // We only care about the frames where we just died
      ),
      mapFramesToDeathStockType(this.playerIndexSpawn(index)), // Map the frame to StockType
    );
  }

  public playerIndexPercentChange(index: number): Observable<PercentChange> {
    return this.stream$.pipe(
      switchMap((stream) => stream.playerFrame$),
      playerFrameFilter(index),
      map((f) => f.players[index]?.post.percent),
      filter(exists),
      distinctUntilChanged(),
      map((percent) => ({
        playerIndex: index,
        percent,
      })),
    );
  }

  public playerIndexStockCountChange(index: number): Observable<StockCountChange> {
    return this.stream$.pipe(
      switchMap((stream) => stream.playerFrame$),
      playerFrameFilter(index),
      map((f) => f.players[index]?.post.stocksRemaining),
      filter(exists),
      distinctUntilChanged(),
      map((stocksRemaining) => ({
        playerIndex: index,
        stocksRemaining,
      })),
    );
  }
}
