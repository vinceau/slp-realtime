import type { GameStartType } from "@slippi/slippi-js";
import type { Observable } from "rxjs";
import { Subject } from "rxjs";
import { map, switchMap, takeUntil, withLatestFrom } from "rxjs/operators";

import type { RxSlpStream } from "../stream";
import type { GameEndPayload } from "../types";
import { findWinner } from "../utils";

export class RealTimeGameEvents {
  private stream$: Observable<RxSlpStream>;
  private destroy$ = new Subject<void>();

  public start$: Observable<GameStartType>;
  public end$: Observable<GameEndPayload>;

  public constructor(stream: Observable<RxSlpStream>) {
    this.stream$ = stream;

    this.start$ = this.stream$.pipe(
      switchMap((s) => s.gameStart$),
      takeUntil(this.destroy$),
    );
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
      takeUntil(this.destroy$),
    );
  }

  public destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
