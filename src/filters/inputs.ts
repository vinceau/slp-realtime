import { Observable, merge } from "rxjs";
import { InputButtonCombo, Input } from "../types";
import { EventEmit, EventManagerConfig } from "../manager/config";
import { map } from "rxjs/operators";
import { playerFilter } from "../operators";

export enum InputEvent {
  BUTTON_COMBO = "button-combo",
}

export const readButtonComboEvents = (
  eventConfig: EventManagerConfig,
  playerInput: (buttons: Input[], duration?: number) => Observable<InputButtonCombo>,
): Observable<EventEmit> => {
  // Handle game start events
  const observables: Observable<EventEmit>[] = eventConfig.events
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
          base$ = base$.pipe(playerFilter(value, eventConfig.variables));
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
