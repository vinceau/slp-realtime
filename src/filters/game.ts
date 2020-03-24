import { Observable, merge } from "rxjs";
import { GameStartType, GameEndPayload } from "../types";
import { EventEmit, EventConfig, EventManagerConfig } from "../manager/config";
import { filter, map } from "rxjs/operators";
import { mapGameStartToContext } from "../operators/game";
import { GameEvents } from "../events";

export enum GameEvent {
  GAME_START = "game-start",
  GAME_END = "game-end",
}

export const readGameConfig = (game: GameEvents, config: EventManagerConfig): Observable<EventEmit> => {
  return merge(
    readGameStartEvents(config.events, game.start$),
    readGameEndEvents(config.events, game.end$),
  );
}

const readGameStartEvents = (events: EventConfig[], gameStart$: Observable<GameStartType>): Observable<EventEmit> => {
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

const readGameEndEvents = (events: EventConfig[], gameEnd$: Observable<GameEndPayload>): Observable<EventEmit> => {
  let base$: Observable<GameEndPayload> = gameEnd$;
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
      // mapGameEndToContext(),
      map(context => ({
        id: event.id,
        payload: context,
      })),
    );
  })
  return merge(...observables);
}
