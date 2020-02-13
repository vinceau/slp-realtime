import { StockType, didLoseStock } from "slp-parser-js";
import { SlpStream } from "../utils/slpStream";
import { map, filter, distinctUntilChanged } from "rxjs/operators";
import { Subject, Subscription, Observable } from "rxjs";
import { playerFilter, withPreviousFrame } from "../operators/frames";
import { mapFrameToSpawnStockType, mapFramesToDeathStockType, filterJustSpawned } from "../operators/stocks";
import { PercentChange, StockCountChange } from "../types";
import { forAllPlayerIndices } from "../utils/helpers";

export class StockEvents {
  private subscriptions = new Array<Subscription>();
  protected stream: SlpStream | null = null;

  private playerSpawnSource$ = new Subject<StockType>();
  private playerDiedSource$ = new Subject<StockType>();
  private percentChangeSource$ = new Subject<PercentChange>();
  private countChangeSource$ = new Subject<StockCountChange>();

  public playerSpawn$ = this.playerSpawnSource$.asObservable();
  public playerDied$ = this.playerDiedSource$.asObservable();
  public percentChange$ = this.percentChangeSource$.asObservable();
  public countChange$ = this.countChangeSource$.asObservable();

  /**
   * Starts listening to the provided stream for Slippi events
   *
   * @param {SlpStream} stream
   * @memberof SlpRealTime
   */
  public setStream(stream: SlpStream): void {
    // Clear previous subscriptions
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];

    this.stream = stream;

    // Handle player spawn
    this.subscriptions.push(
      forAllPlayerIndices(this.playerIndexSpawn).subscribe(this.playerSpawnSource$)
    );

    // Handle player death
    this.subscriptions.push(
      forAllPlayerIndices(this.playerIndexDied).subscribe(this.playerDiedSource$)
    );

    // Handle player percent change
    this.subscriptions.push(
      forAllPlayerIndices(this.playerIndexPercentChange).subscribe(this.percentChangeSource$)
    );

    // Handle stock count change
    this.subscriptions.push(
      forAllPlayerIndices(this.playerIndexStockCountChange).subscribe(this.countChangeSource$)
    );
  }

  /**
   * Emits an event each time player spawns.
   */
  public playerIndexSpawn(index: number): Observable<StockType> {
    if (!this.stream) {
      throw new Error("No stream to subscribe to");
    }

    return this.stream.playerFrame$.pipe(
      filterJustSpawned(index),             // Only take the spawn frames
      map((f) => f.players[index].post),    // Only take the post frame data
      mapFrameToSpawnStockType(this.stream.gameStart$, index), // Map the frame to StockType
    );
  }

  /**
   * Emits an event each time player dies.
   */
  public playerIndexDied(index: number): Observable<StockType> {
    if (!this.stream) {
      throw new Error("No stream to subscribe to");
    }

    return this.stream.playerFrame$.pipe(
      playerFilter(index),                  // We only care about certain player frames
      map((f) => f.players[index].post),    // Only take the post frame data
      withPreviousFrame(),                  // Get previous frame too
      filter(([prevFrame, latestFrame]) =>
        didLoseStock(latestFrame, prevFrame)     // We only care about the frames where we just died
      ),
      mapFramesToDeathStockType(this.playerIndexSpawn(index)), // Map the frame to StockType
    );
  }

  public playerIndexPercentChange(index: number): Observable<PercentChange> {
    if (!this.stream) {
      throw new Error("No stream to subscribe to");
    }
    return this.stream.playerFrame$.pipe(
      playerFilter(index),
      map(f => f.players[index].post.percent),
      distinctUntilChanged(),
      map(percent => ({
        playerIndex: index,
        percent,
      })),
    );
  }

  public playerIndexStockCountChange(index: number): Observable<StockCountChange> {
    if (!this.stream) {
      throw new Error("No stream to subscribe to");
    }
    return this.stream.playerFrame$.pipe(
      playerFilter(index),
      map(f => f.players[index].post.stocksRemaining),
      distinctUntilChanged(),
      map(stocksRemaining => ({
        playerIndex: index,
        stocksRemaining,
      })),
    );
  }

}
