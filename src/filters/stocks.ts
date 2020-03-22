import { Observable, merge } from "rxjs";
import { StockType } from "../types";
import { EventEmit, EventManagerConfig } from "../manager/config";
import { map } from "rxjs/operators";
import { playerFilter } from "../operators/player";

export enum StockEvent {
  PLAYER_SPAWN = "player-spawn",
  PLAYER_DIED = "player-died",
}

export const readPlayerSpawnEvents = (
  eventConfig: EventManagerConfig,
  playerSpawn$: Observable<StockType>,
): Observable<EventEmit> => {
  // Handle game start events
  const observables: Observable<EventEmit>[] = eventConfig.events
    .filter(event => event.type === StockEvent.PLAYER_SPAWN)
    .map(event => {
      let base$ = playerSpawn$;

      if (event.filter) {
        // Handle num players filter
        for (const [key, value] of Object.entries(event.filter)) {
          switch (key) {
          case "playerIndex":
            base$ = base$.pipe(playerFilter(value, eventConfig.variables));
            break;
          }
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
  eventConfig: EventManagerConfig,
  playerDied$: Observable<StockType>,
): Observable<EventEmit> => {
  // Handle game end events
  const observables: Observable<EventEmit>[] = eventConfig.events
    .filter(event => event.type === StockEvent.PLAYER_DIED)
    .map(event => {
      let base$ = playerDied$;

      if (event.filter) {
        // Handle num players filter
        for (const [key, value] of Object.entries(event.filter)) {
          switch (key) {
          case "playerIndex":
            base$ = base$.pipe(playerFilter(value, eventConfig.variables));
            break;
          }
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
