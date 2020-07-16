import { didLoseStock } from "@slippi/slippi-js";
import { SlpStream } from "../stream";
import { map, filter, distinctUntilChanged, switchMap } from "rxjs/operators";
import { Observable } from "rxjs";
import { playerFrameFilter, withPreviousFrame } from "../operators/frames";
import { mapFrameToSpawnStockType, mapFramesToDeathStockType, filterJustSpawned } from "../operators/stocks";
import { StockType, PercentChange, StockCountChange } from "../types";
import { forAllPlayerIndices } from "../utils";

export class StockEvents {
  private stream$: Observable<SlpStream>;

  public playerSpawn$: Observable<StockType>;
  public playerDied$: Observable<StockType>;
  public percentChange$: Observable<PercentChange>;
  public countChange$: Observable<StockCountChange>;

  public constructor(stream: Observable<SlpStream>) {
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
          map((f) => f.players[index].post), // Only take the post frame data
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
      map((f) => f.players[index].post), // Only take the post frame data
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
      map((f) => f.players[index].post.percent),
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
      map((f) => f.players[index].post.stocksRemaining),
      distinctUntilChanged(),
      map((stocksRemaining) => ({
        playerIndex: index,
        stocksRemaining,
      })),
    );
  }
}
