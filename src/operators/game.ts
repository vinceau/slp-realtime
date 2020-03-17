import { OperatorFunction, Observable } from "rxjs";
import { GameStartType, GameEndType } from "../types";
import { Context } from "../context/types";
import { map } from "rxjs/operators";
import { generateGameStartContext, generateGameEndContext } from "../context/game";

export function mapGameStartToContext(): OperatorFunction<GameStartType, Context> {
  return (source: Observable<GameStartType>): Observable<Context> => source.pipe(
    map(settings => generateGameStartContext(settings)),
  );
}

export function mapGameEndToContext(): OperatorFunction<GameEndType, Context> {
  return (source: Observable<GameEndType>): Observable<Context> => source.pipe(
    map(settings => generateGameEndContext(settings)),
  );
}
