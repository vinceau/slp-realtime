import { Observable, merge } from "rxjs";
import { ComboEventPayload } from "../types";
import { EventEmit, EventManagerConfig, EventConfig, EventManagerVariables } from "../manager/config";
import { map, filter } from "rxjs/operators";
import { playerFilterMatches } from "../operators/player";
import { ComboEvents } from "../events/combos";
import { checkCombo, defaultComboFilterSettings } from "../combo/filter";

export enum ComboEvent {
  START = "combo-start",                  // Emitted for the start of all "combos"
  EXTEND = "combo-extend",                // Emitted for the extension of all "combos"
  END = "combo-end",                      // Emitted for the end of all "combos"
  MATCH = "combo-match",                  // Emitted for all combos matching criteria
  CONVERSION = "conversion",              // Emitted for all "conversions"
  CONVERSION_MATCH = "conversion-match",  // Emitted for all conversions that match criteria
}

export const readComboConfig = (combo: ComboEvents, config: EventManagerConfig): Observable<EventEmit> => {
  const startObservables = config.events.filter(event => event.type === ComboEvent.START).map(event => {
    return handlePlayerIndexFilter(combo.start$, event, config.variables).pipe(
      map(payload => ({
        id: event.id,
        payload,
      })),
    );
  });
  const extendObservables = config.events.filter(event => event.type === ComboEvent.EXTEND).map(event => {
    return handlePlayerIndexFilter(combo.extend$, event, config.variables).pipe(
      map(payload => ({
        id: event.id,
        payload,
      })),
    );
  });
  const endObservables = config.events.filter(event => event.type === ComboEvent.END).map(event => {
    const base$ = handlePlayerIndexFilter(combo.end$, event, config.variables);
    return base$.pipe(
      map(payload => ({
        id: event.id,
        payload,
      })),
    );
  });
  const comboObservables = config.events.filter(event => event.type === ComboEvent.MATCH).map(event => {
    const base$ = handlePlayerIndexFilter(combo.end$, event, config.variables);
    return handleComboFilter(base$, event, config.variables).pipe(
      map(payload => ({
        id: event.id,
        payload,
      })),
    );
  });
  const conversionObservables = config.events.filter(event => event.type === ComboEvent.CONVERSION).map(event => {
    const base$ = handlePlayerIndexFilter(combo.conversion$, event, config.variables);
    return base$.pipe(
      map(payload => ({
        id: event.id,
        payload,
      })),
    );
  });
  const conversionMatchObservables = config.events.filter(event => event.type === ComboEvent.CONVERSION_MATCH).map(event => {
    const base$ = handlePlayerIndexFilter(combo.conversion$, event, config.variables);
    return handleComboFilter(base$, event, config.variables).pipe(
      map(payload => ({
        id: event.id,
        payload,
      })),
    );
  });

  const observables: Observable<EventEmit>[] = [
    ...startObservables,
    ...extendObservables,
    ...endObservables,
    ...comboObservables,
    ...conversionObservables,
    ...conversionMatchObservables,
  ];

  return merge(...observables);
}

const handlePlayerIndexFilter = (
  base$: Observable<ComboEventPayload>,
  event: EventConfig,
  variables?: EventManagerVariables,
): Observable<ComboEventPayload> => {
  if (event.filter && event.filter.playerIndex) {
    const value = event.filter.playerIndex;
    base$ = base$.pipe(
      filter(payload => playerFilterMatches(payload.combo.playerIndex, value, variables)),
    );
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
      }
    } else {
      comboSettings = Object.assign(comboSettings, options);
    }
  }
  return base$.pipe(
    filter(payload => checkCombo(comboSettings, payload.combo, payload.settings)),
  );
};
