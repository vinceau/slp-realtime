import type { Observable } from "rxjs";
import type { RxSlpStream } from "../stream";
import { withLatestFrom, map, switchMap } from "rxjs/operators";
import { findWinner } from "../utils";
import type { GameStartType, GameEndPayload } from "../types";

export class GameEvents {
  private stream$: Observable<RxSlpStream>;

  public start$: Observable<GameStartType>;
  public end$: Observable<GameEndPayload>;

  public constructor(stream: Observable<RxSlpStream>) {
    this.stream$ = stream;

    this.start$ = this.stream$.pipe(switchMap((s) => s.gameStart$));
    this.end$ = this.stream$.pipe(
      switchMap((s) =>
        s.gameEnd$.pipe(
          withLatestFrom(s.playerFrame$),
          map(([gameEnd, playerFrame]) => ({
            ...gameEnd,
            winnerPlayerIndex: findWinner(playerFrame),
          })),
        ),
      ),
    );
  }
}
