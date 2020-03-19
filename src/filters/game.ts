import { Observable, merge } from "rxjs";
import { GameStartType, GameEndType } from "../types";
import { EventEmit, EventConfig } from "../manager/config";
import { filter, map } from "rxjs/operators";
import { mapGameStartToContext, mapGameEndToContext } from "../operators/game";

export enum GameEvent {
  GAME_START = "game-start",
  GAME_END = "game-end",
}

export const readGameStartEvents = (events: EventConfig[], gameStart$: Observable<GameStartType>): Observable<EventEmit> => {
  // Handle game start events
  const observables: Observable<EventEmit>[] = events.filter(event => event.type === GameEvent.GAME_START).map(event => {
    let base$: Observable<GameStartType> = gameStart$;
    if (event.filter) {
      // Handle num players filter
      for (const [key, value] of Object.entries(event.filter)) {
        switch (key) {
        case "numPlayers":
          const numPlayers = value as number;
          base$ = base$.pipe(
            filter(settings => settings.players.length === numPlayers),
          );
          break;
        case "isTeams":
          const isTeams = value as boolean;
          base$ = base$.pipe(
            filter(settings => settings.isTeams === isTeams),
          );
          break;
        }
      }
    }
    return base$.pipe(
      mapGameStartToContext(),
      map(context => ({
        id: event.id,
        payload: context,
      })),
    );
  })
  return merge(...observables);
}

export const readGameEndEvents = (events: EventConfig[], gameEnd$: Observable<GameEndType>): Observable<EventEmit> => {
  let base$: Observable<GameEndType> = gameEnd$;
  // Handle game end events
  const observables: Observable<EventEmit>[] = events.filter(event => event.type === GameEvent.GAME_END).map(event => {
    if (event.filter) {
    // Handle end method filter
      for (const [key, value] of Object.entries(event.filter)) {
        switch (key) {
        case "endMethod":
          const method = value as number;
          base$ = base$.pipe(
            filter(end => end.gameEndMethod === method),
          );
          break;
        }
      }
    }
    return base$.pipe(
      mapGameEndToContext(),
      map(context => ({
        id: event.id,
        payload: context,
      })),
    );
  })
  return merge(...observables);
}
