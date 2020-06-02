import { Observable } from "rxjs";
import { SlpStream } from "../stream";
import { withLatestFrom, map, switchMap } from "rxjs/operators";
import { findWinner } from "../utils";
import { GameStartType, GameEndPayload } from "../types";

export class GameEvents {
  private stream$: Observable<SlpStream>;

  public start$: Observable<GameStartType>;
  public end$: Observable<GameEndPayload>;

  public constructor(stream: Observable<SlpStream>) {
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
