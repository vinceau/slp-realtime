import { GameStartType, GameEndType } from "slp-parser-js";
import { Observable, merge } from "rxjs";
import { SlpStream } from "../utils/slpStream";
import { withLatestFrom, map, switchMap } from "rxjs/operators";
import { findWinner } from "../utils/helpers";
import { EventEmit, EventManagerConfig } from "../manager/config";
import { readGameStartEvents, readGameEndEvents } from "../filters/game";
import { EventsContainer } from "./types";

export class GameEvents implements EventsContainer {
  private stream$: Observable<SlpStream>;

  public start$: Observable<GameStartType>;
  public end$: Observable<GameEndType>;
  public winner$: Observable<number>;

  public constructor(stream: Observable<SlpStream>) {
    this.stream$ = stream;

    this.start$ = this.stream$.pipe(
      switchMap(s => s.gameStart$),
    );
    this.end$ = this.stream$.pipe(
      switchMap(s => s.gameEnd$),
    );

    this.winner$ = this.stream$.pipe(
      switchMap(s => s.gameEnd$.pipe(
        withLatestFrom(s.playerFrame$),
        map(([_, playerFrame]) => findWinner(playerFrame)),
      )),
    );
  }

  public readConfig(config: EventManagerConfig): Observable<EventEmit> {
    return merge(
      readGameStartEvents(config.events, this.start$),
      readGameEndEvents(config.events, this.end$),
    );
  }
}
