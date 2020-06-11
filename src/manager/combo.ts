import { Observable, merge } from "rxjs";
import { ComboEventPayload } from "../types";
import { EventEmit, EventManagerConfig, EventConfig, EventManagerVariables } from "./types";
import { map, filter } from "rxjs/operators";
import { playerFilterMatches } from "../operators/player";
import { ComboEvents } from "../events/combos";
import { checkCombo, defaultComboFilterSettings } from "../utils";

export enum ComboEvent {
  START = "combo-start", // Emitted at the start of a combo
  EXTEND = "combo-extend", // Emitted at the extension of a combo
  END = "combo-occurred", // Emitted at the end of a combo
  CONVERSION = "conversion-occurred", // Emitted at the end of a conversion
}

export const readComboConfig = (combo: ComboEvents, config: EventManagerConfig): Observable<EventEmit> => {
  const startObservables = config.events
    .filter((event) => event.type === ComboEvent.START)
    .map((event) => {
      return handlePlayerIndexFilter(combo.start$, event, config.variables).pipe(
        map((payload) => ({
          id: event.id,
          payload,
        })),
      );
    });
  const extendObservables = config.events
    .filter((event) => event.type === ComboEvent.EXTEND)
    .map((event) => {
      return handlePlayerIndexFilter(combo.extend$, event, config.variables).pipe(
        map((payload) => ({
          id: event.id,
          payload,
        })),
      );
    });
  const endObservables = config.events
    .filter((event) => event.type === ComboEvent.END)
    .map((event) => {
      const base$ = handlePlayerIndexFilter(combo.end$, event, config.variables);
      return handleComboFilter(base$, event, config.variables).pipe(
        map((payload) => ({
          id: event.id,
          payload,
        })),
      );
    });
  const conversionObservables = config.events
    .filter((event) => event.type === ComboEvent.CONVERSION)
    .map((event) => {
      const base$ = handlePlayerIndexFilter(combo.conversion$, event, config.variables);
      return handleComboFilter(base$, event, config.variables).pipe(
        map((payload) => ({
          id: event.id,
          payload,
        })),
      );
    });

  const observables: Observable<EventEmit>[] = [
    ...startObservables,
    ...extendObservables,
    ...endObservables,
    ...conversionObservables,
  ];

  return merge(...observables);
};

const handlePlayerIndexFilter = (
  base$: Observable<ComboEventPayload>,
  event: EventConfig,
  variables?: EventManagerVariables,
): Observable<ComboEventPayload> => {
  if (event.filter && event.filter.playerIndex) {
    const value = event.filter.playerIndex;
    base$ = base$.pipe(filter((payload) => playerFilterMatches(payload.combo.playerIndex, value, variables)));
  }
  return base$;
};

/*
You can set the combo filter from:
- passing it directly as `comboCriteria` parameter in the filter
- setting it as a $ prefixed variable in the variables object and referencing
  that object as a string.
*/
const handleComboFilter = (
  base$: Observable<ComboEventPayload>,
  event: EventConfig,
  variables?: EventManagerVariables,
): Observable<ComboEventPayload> => {
  let comboSettings = Object.assign({}, defaultComboFilterSettings);
  if (event.filter && event.filter.comboCriteria) {
    const options = event.filter.comboCriteria;
    if (typeof options === "string") {
      if (options.charAt(0) === "$" && variables[options]) {
        comboSettings = Object.assign(comboSettings, variables[options]);
      } else if (options === "none") {
        // Require explicit specification for no criteria matching
        return base$;
      }
    } else {
      comboSettings = Object.assign(comboSettings, options);
    }
  }
  return base$.pipe(filter((payload) => checkCombo(comboSettings, payload.combo, payload.settings)));
};
