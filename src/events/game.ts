import { GameStartType, GameEndType } from "slp-parser-js";
import { Subject, Subscription } from "rxjs";
import { SlpStream } from "../utils/slpStream";
import { withLatestFrom, map } from "rxjs/operators";
import { findWinner } from "../utils/helpers";

export class GameEvents {
  private subscriptions = new Array<Subscription>();

  private startSource$ = new Subject<GameStartType>();
  private endSource$ = new Subject<GameEndType>();
  private winnerSource$ = new Subject<number>();

  public start$ = this.startSource$.asObservable();
  public end$ = this.endSource$.asObservable();
  public winner$ = this.winnerSource$.asObservable();

  public setStream(stream: SlpStream): void {
    // Clear previous subscriptions
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];

    // Add new subscriptions
    this.subscriptions.push(
      stream.gameStart$.subscribe(this.startSource$),
      stream.gameEnd$.subscribe(this.endSource$),
    );

    this.subscriptions.push(
      stream.gameEnd$.pipe(
        withLatestFrom(stream.playerFrame$),
        map(([_, playerFrame]) => findWinner(playerFrame)),
      ).subscribe(this.winnerSource$),
    );
  }
}
