import { GameStartType, GameEndType } from "slp-parser-js";
import { Observable } from "rxjs";
import { SlpStream } from "../utils/slpStream";
import { withLatestFrom, map } from "rxjs/operators";
import { findWinner } from "../utils/helpers";

export class GameEvents {
  public start$: Observable<GameStartType>;
  public end$: Observable<GameEndType>;
  public winner$: Observable<number>;

  public setStream(stream: SlpStream): void {
    this.start$ = stream.gameStart$;
    this.end$ = stream.gameEnd$;

    this.winner$ = stream.gameEnd$.pipe(
      withLatestFrom(stream.playerFrame$),
      map(([_, playerFrame]) => findWinner(playerFrame)),
    );
  }
}
