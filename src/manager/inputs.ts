import { Observable, merge } from "rxjs";
import { InputButtonCombo } from "../types";
import { EventEmit, EventManagerConfig, EventConfig, InputEventFilter, InputEvent } from "./types";
import { map } from "rxjs/operators";
import { playerFilter } from "../operators";
import { InputEvents } from "../events/inputs";

export const readInputsConfig = (inputs: InputEvents, config: EventManagerConfig): Observable<EventEmit> => {
  return readButtonComboEvents(config, (buttons, duration) => inputs.buttonCombo(buttons, duration));
};

interface InputEventConfig extends EventManagerConfig {
  events: Array<
    EventConfig & {
      type: InputEvent;
      filter?: InputEventFilter;
    }
  >;
}

const readButtonComboEvents = (
  eventConfig: EventManagerConfig,
  playerInput: (buttons: string[], duration?: number) => Observable<InputButtonCombo>,
): Observable<EventEmit> => {
  // Handle game start events
  const observables: Observable<EventEmit>[] = (eventConfig as InputEventConfig).events
    .filter((event) => event.type === InputEvent.BUTTON_COMBO)
    .filter((event) => event.filter && event.filter.combo && event.filter.combo.length > 0) // We must have a valid filter
    .map((event) => {
      let duration = 1;
      if (event.filter.duration && event.filter.duration > 1) {
        duration = Math.floor(event.filter.duration);
      }

      let base$: Observable<InputButtonCombo> = playerInput(event.filter.combo, duration);

      if (event.filter) {
        // Handle num players filter
        if (event.filter.playerIndex !== undefined) {
          base$ = base$.pipe(playerFilter(event.filter.playerIndex, eventConfig.variables));
        }
      }

      return base$.pipe(
        map(
          (context): EventEmit => ({
            id: event.id,
            type: event.type,
            payload: context,
          }),
        ),
      );
    });
  return merge(...observables);
};
