import { Observable, merge } from "rxjs";
import { StockType } from "../types";
import { EventEmit, EventConfig } from "../manager/config";
import { map } from "rxjs/operators";
import { playerIndexFilter } from "../operators";

export enum StockEvent {
  PLAYER_SPAWN = "player-spawn",
  PLAYER_DIED = "player-died",
}

export const readPlayerSpawnEvents = (
  events: EventConfig[],
  playerSpawn$: Observable<StockType>,
): Observable<EventEmit> => {
  // Handle game start events
  const observables: Observable<EventEmit>[] = events
    .filter(event => event.type === StockEvent.PLAYER_SPAWN)
    .map(event => {
      let base$ = playerSpawn$;

      // Handle num players filter
      for (const [key, value] of Object.entries(event.filter)) {
        switch (key) {
        case "playerIndex":
          base$ = base$.pipe(playerIndexFilter(value));
          break;
        }
      }

      return base$.pipe(
        map(context => ({
          id: event.id,
          payload: context,
        })),
      );
    })
  return merge(...observables);
}

export const readPlayerDiedEvents = (
  events: EventConfig[],
  playerDied$: Observable<StockType>,
): Observable<EventEmit> => {
  // Handle game end events
  const observables: Observable<EventEmit>[] = events
    .filter(event => event.type === StockEvent.PLAYER_DIED)
    .map(event => {
      let base$ = playerDied$;

      // Handle num players filter
      for (const [key, value] of Object.entries(event.filter)) {
        switch (key) {
        case "playerIndex":
          base$ = base$.pipe(playerIndexFilter(value));
          break;
        }
      }

      return base$.pipe(
        map(context => ({
          id: event.id,
          payload: context,
        })),
      );
    })
  return merge(...observables);
}
