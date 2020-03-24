import { Observable, merge } from "rxjs";
import { ComboEventPayload } from "../types";
import { EventEmit, EventManagerConfig, EventConfig, EventManagerVariables } from "../manager/config";
import { map, filter } from "rxjs/operators";
import { playerFilterMatches } from "../operators/player";
import { ComboEvents } from "../events/combos";
import { checkCombo, defaultComboFilterSettings } from "../combo/filter";

export enum ComboEvent {
  START = "combo-start",
  EXTEND = "combo-extend",
  END = "combo-end",
  CONVERSION = "conversion",
}

export const readComboConfig = (stocks: ComboEvents, config: EventManagerConfig): Observable<EventEmit> => {
  const startObservables = config.events.filter(event => event.type === ComboEvent.START).map(event => {
    return handlePlayerIndexFilter(stocks.start$, event, config.variables).pipe(
      map(payload => ({
        id: event.id,
        payload,
      })),
    )
  });
  const extendObservables = config.events.filter(event => event.type === ComboEvent.EXTEND).map(event => {
    return handlePlayerIndexFilter(stocks.extend$, event, config.variables).pipe(
      map(payload => ({
        id: event.id,
        payload,
      })),
    )
  });
  const endObservables = config.events.filter(event => event.type === ComboEvent.END).map(event => {
    const base$ = handlePlayerIndexFilter(stocks.end$, event, config.variables);
    return handleComboFilter(base$, event, config.variables).pipe(
      map(payload => ({
        id: event.id,
        payload,
      })),
    )
  });
  const conversionObservables = config.events.filter(event => event.type === ComboEvent.CONVERSION).map(event => {
    const base$ = handlePlayerIndexFilter(stocks.conversion$, event, config.variables);
    return handleComboFilter(base$, event, config.variables).pipe(
      map(payload => ({
        id: event.id,
        payload,
      })),
    )
  });

  return merge(
    ...startObservables,
    ...extendObservables,
    ...endObservables,
    ...conversionObservables,
  );
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
  if (event.filter && event.filter.comboCriteria) {
    let comboSettings = Object.assign({}, defaultComboFilterSettings);
    const options = event.filter.comboCriteria;
    if (typeof options === "string") {
      if (options.charAt(0) === "$" && variables[options]) {
        comboSettings = Object.assign(comboSettings, variables[options]);
      }
    } else {
      comboSettings = Object.assign(comboSettings, options);
    }
    base$ = base$.pipe(
      filter(payload => checkCombo(comboSettings, payload.combo, payload.settings)),
    );
  }
  return base$;
};
