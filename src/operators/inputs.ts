import type { FrameEntryType } from "@slippi/slippi-js";
import { Frames } from "@slippi/slippi-js";
import type { MonoTypeOperatorFunction, Observable, OperatorFunction } from "rxjs";
import { distinctUntilChanged, filter, map, scan } from "rxjs/operators";

import type { InputButtonCombo } from "../types";
import { bitmaskToButtons, generateInputBitmask } from "../utils";
import { exists } from "../utils/exists";
import { playerFrameFilter } from "./frames";

/**
 * Throttle inputs for a number of frames
 */
export function throttleInputButtons(frames: number): MonoTypeOperatorFunction<InputButtonCombo> {
  return (source: Observable<InputButtonCombo>): Observable<InputButtonCombo> =>
    source.pipe(
      distinctUntilChanged((prev, curr) => {
        // Should we discard this value?
        // Discard if the current frame is still within the lockout duration
        return curr.frame < prev.frame + frames;
      }),
    );
}

export function mapFramesToButtonInputs(
  index: number,
  buttons: string[],
  duration = 1,
): OperatorFunction<FrameEntryType, InputButtonCombo> {
  const controlBitMask = generateInputBitmask(...buttons);
  return (source: Observable<FrameEntryType>): Observable<InputButtonCombo> =>
    source.pipe(
      // Filter for the specific player
      playerFrameFilter(index),
      // Map the frames to whether the button combination was pressed or not
      // while tracking the frame number
      map((f): {
        frame: number;
        buttonPressed: boolean;
        buttonCombo: string[];
      } | null => {
        const buttonCombo = f.players[index]?.pre.physicalButtons;
        if (!exists(buttonCombo)) {
          return null;
        }
        const buttonComboPressed = (buttonCombo & controlBitMask) === controlBitMask;
        return {
          frame: f.frame,
          buttonPressed: buttonComboPressed,
          buttonCombo: bitmaskToButtons(buttonCombo),
        };
      }),
      filter(exists),
      // Count the number of consecutively pressed frames
      scan(
        (
          acc,
          data,
        ): {
          count: number;
          frame: number;
          buttonCombo: string[];
        } => {
          const count = data.buttonPressed ? acc.count + 1 : 0;
          return {
            count,
            frame: data.frame,
            buttonCombo: data.buttonCombo,
          };
        },
        {
          count: 0,
          frame: Frames.FIRST,
          buttonCombo: [] as string[],
        },
      ),
      // Filter to be the exact frame when we pressed the combination for sufficient frames
      filter((n) => n.count === duration),
      // Return the player index which triggered the button press
      map((data) => ({
        playerIndex: index,
        combo: data.buttonCombo,
        frame: data.frame,
        duration,
      })),
    );
}
