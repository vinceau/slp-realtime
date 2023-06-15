import type { Observable } from "rxjs";
import { merge } from "rxjs";
import { switchMap } from "rxjs/operators";

import { mapFramesToButtonInputs } from "../operators";
import type { RxSlpStream } from "../stream";
import type { InputButtonCombo } from "../types";
import { forAllPlayerIndices } from "../utils";
import { findPlayerIndexByName } from "../utils/names";

export class InputEvents {
  private stream$: Observable<RxSlpStream>;

  public constructor(stream: Observable<RxSlpStream>) {
    this.stream$ = stream;
  }

  public buttonCombo(buttons: string[], duration?: number): Observable<InputButtonCombo> {
    return forAllPlayerIndices((i) => this.playerIndexButtonCombo(i, buttons, duration));
  }

  public playerNameButtonCombo({
    namesToFind,
    buttons,
    duration,
    fuzzyNameMatch,
  }: {
    namesToFind: string[];
    buttons: string[];
    duration?: number;
    fuzzyNameMatch?: boolean;
  }): Observable<InputButtonCombo> {
    return this.stream$.pipe(
      switchMap((stream) => stream.gameStart$),
      switchMap((settings) => {
        const matchingPlayerIndices = findPlayerIndexByName(settings, null, {
          namesToFind,
          fuzzyMatch: fuzzyNameMatch,
        });
        const matchingPlayerButtonCombos = matchingPlayerIndices.map((index) =>
          this.playerIndexButtonCombo(index, buttons, duration),
        );
        return merge(...matchingPlayerButtonCombos);
      }),
    );
  }

  /**
   * Returns an observable which emits when `buttons` is held for `duration` number of frames.
   *
   * @param {number} index The player index
   * @param {number} buttons The button combination
   * @param {number} duration The number of frames the buttons were held for
   * @returns {Observable<number>}
   * @memberof InputEvents
   */
  public playerIndexButtonCombo(index: number, buttons: string[], duration = 1): Observable<InputButtonCombo> {
    return this.stream$.pipe(
      // Get the player frames
      switchMap((stream) => stream.playerFrame$),
      // Map the frames to button inputs
      mapFramesToButtonInputs(index, buttons, duration),
    );
  }
}
