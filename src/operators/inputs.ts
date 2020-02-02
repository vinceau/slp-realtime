import { ControllerInput } from "../types";
import { MonoTypeOperatorFunction, Observable } from "rxjs";
import { generateControllerBitmask } from "../utils";
import { filter } from "rxjs/operators";
import { ButtonComboPayload } from "../events/inputs";

/**
 * Filters only buttton inputs which match a given button combo
 */
export function filterButtonCombo(...buttons: ControllerInput[]): MonoTypeOperatorFunction<ButtonComboPayload> {
  const controlBitMask = generateControllerBitmask(...buttons);
  return (source): Observable<ButtonComboPayload> => source.pipe(
    filter(b => (b.buttonCombo & controlBitMask) === controlBitMask),
  );
}
