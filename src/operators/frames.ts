import { FrameEntryType, Frames } from "slp-parser-js";
import { Observable, MonoTypeOperatorFunction, OperatorFunction } from "rxjs";
import { filter, pairwise } from "rxjs/operators";

/**
 * Filter the frames to only those that belong to the player {index}.
 */
export function playerFrameFilter(index: number): MonoTypeOperatorFunction<FrameEntryType> {
  return (source: Observable<FrameEntryType>): Observable<FrameEntryType> => source.pipe(
    filter((frame) => {
      const playerIndices = Object.keys(frame.players);
      return playerIndices.includes(index.toString());
    }),
  );
}

/**
 * Return the previous frame of the game and the current frame
 */
export function withPreviousFrame<T extends { frame: number }>(): OperatorFunction<T, [T, T]> {
  return (source: Observable<T>): Observable<[T, T]> => source.pipe(
    pairwise(),                            // We want both the latest frame and the previous frame
    filter(([prevFrame, latestFrame]) =>
      latestFrame.frame > prevFrame.frame  // Filter out the frames from last game
    ),
  );
}

/**
 * Return the previous frame of the game and the current frame
 */
export function filterOnlyFirstFrame<T extends { frame: number }>(): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>): Observable<T> => source.pipe(
    filter((frame) =>
      frame.frame === Frames.FIRST,
    ),
  );
}
