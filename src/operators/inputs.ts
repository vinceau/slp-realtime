import { InputButtonCombo, FrameEntryType, Frames } from "../types";
import { Observable, MonoTypeOperatorFunction, OperatorFunction } from "rxjs";
import { distinctUntilChanged, map, scan, filter } from "rxjs/operators";
import { playerFrameFilter } from "./frames";
import { generateInputBitmask } from "../utils";

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
      } => {
        const buttonCombo = f.players[index].pre.physicalButtons;
        const buttonComboPressed = (buttonCombo & controlBitMask) === controlBitMask;
        return {
          frame: f.frame,
          buttonPressed: buttonComboPressed,
        };
      }),
      // Count the number of consecutively pressed frames
      scan(
        (acc, data) => {
          const count = data.buttonPressed ? acc.count + 1 : 0;
          return {
            count,
            frame: data.frame,
          };
        },
        {
          count: 0,
          frame: Frames.FIRST,
        },
      ),
      // Filter to be the exact frame when we pressed the combination for sufficient frames
      filter((n) => n.count === duration),
      // Return the player index which triggered the button press
      map((data) => ({
        playerIndex: index,
        combo: buttons,
        frame: data.frame,
        duration,
      })),
    );
}
