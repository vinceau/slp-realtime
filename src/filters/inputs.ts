import { Observable, merge } from "rxjs";
import { InputButtonCombo, Input } from "../types";
import { EventEmit, EventConfig } from "../manager/config";
import { filter, map } from "rxjs/operators";

export enum InputEvent {
  BUTTON_COMBO = "button-combo",
}

export const readButtonComboEvents = (
  events: EventConfig[],
  playerInput: (buttons: Input[], duration?: number) => Observable<InputButtonCombo>,
): Observable<EventEmit> => {
  // Handle game start events
  const observables: Observable<EventEmit>[] = events
    .filter(event => event.type === InputEvent.BUTTON_COMBO)
    .filter(event => event.filter && event.filter.combo && event.filter.combo.length > 0)  // We must have a valid filter
    .map(event => {
      let duration = 1;
      if (event.filter.duration && event.filter.duration > 1) {
        duration = Math.floor(event.filter.duration);
      }

      let base$: Observable<InputButtonCombo> = playerInput(event.filter.combo, duration);

      // Handle num players filter
      for (const [key, value] of Object.entries(event.filter)) {
        switch (key) {
        case "playerIndex":
          const playerIndex = value as number;
          base$ = base$.pipe(
            filter(payload => payload.playerIndex === playerIndex),
          );
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