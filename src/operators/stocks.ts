import type { FrameEntryType, GameStartType, PostFrameUpdateType, StockType } from "@slippi/slippi-js";
import { isDead } from "@slippi/slippi-js";
import type { MonoTypeOperatorFunction, Observable, OperatorFunction } from "rxjs";
import { merge } from "rxjs";
import { filter, map, withLatestFrom } from "rxjs/operators";

import { exists } from "../utils/exists";
import { filterOnlyFirstFrame, playerFrameFilter, withPreviousFrame } from "./frames";

/**
 * Filter only the frames where the player has just spawned
 */
export function filterJustSpawned(playerIndex: number): MonoTypeOperatorFunction<FrameEntryType> {
  return (source$): Observable<FrameEntryType> => {
    const initialSpawn$ = source$.pipe(playerFrameFilter(playerIndex), filterOnlyFirstFrame());

    const normalSpawns$ = source$.pipe(
      playerFrameFilter(playerIndex),
      withPreviousFrame(), // Get previous frame too
      filter(([prevFrame, latestFrame]) => {
        const prevActionState = prevFrame.players[playerIndex]?.post.actionStateId ?? null;
        const currActionState = latestFrame.players[playerIndex]?.post.actionStateId ?? null;
        if (prevActionState === null || currActionState === null) {
          return false;
        }
        // We only care about the frames where we just spawned
        return isDead(prevActionState) && !isDead(currActionState);
      }),
      map(([_, latestFrame]) => latestFrame),
    );

    return merge(initialSpawn$, normalSpawns$);
  };
}

/**
 * Filter only the frames where the player has just spawned
 */
// export function filterJustDied(playerIndex: number): MonoTypeOperatorFunction<FrameEntryType> {
//   return (source$): Observable<FrameEntryType> => {
//     return source$.pipe(
//       playerFilter(playerIndex),
//       withPreviousFrame(),                  // Get previous frame too
//       filter(([prevFrame, latestFrame]) => {
//         const prevPostFrame = prevFrame.players[playerIndex].post;
//         const currPostFrame = latestFrame.players[playerIndex].post;
//         // We only care about the frames where we just spawned
//         return didLoseStock(currPostFrame, prevPostFrame);
//       }),
//       map(([_, latestFrame]) => latestFrame),
//     );
//   }
// }

export function mapFrameToSpawnStockType(
  settings$: Observable<GameStartType>,
  playerIndex: number,
): OperatorFunction<PostFrameUpdateType, StockType> {
  return (source: Observable<PostFrameUpdateType>): Observable<StockType> =>
    source.pipe(
      withLatestFrom(settings$),
      map(([frame, settings]): StockType | null => {
        const player = settings.players.find((player) => player.playerIndex === playerIndex);
        if (!player || !exists(frame.frame) || !exists(frame.stocksRemaining)) {
          return null;
        }
        const stock: StockType = {
          playerIndex: player.playerIndex,
          startFrame: frame.frame,
          endFrame: null,
          startPercent: 0,
          endPercent: null,
          currentPercent: 0,
          count: frame.stocksRemaining,
          deathAnimation: null,
        };
        return stock;
      }),
      filter(exists),
    );
}

export function mapFramesToDeathStockType(
  playerSpawned$: Observable<StockType>,
): OperatorFunction<[PostFrameUpdateType, PostFrameUpdateType], StockType> {
  return (source: Observable<[PostFrameUpdateType, PostFrameUpdateType]>): Observable<StockType> =>
    source.pipe(
      withLatestFrom(playerSpawned$),
      map(([[prevPlayerFrame, playerFrame], spawnStock]) => ({
        ...spawnStock,
        endFrame: playerFrame.frame,
        endPercent: prevPlayerFrame.percent ?? 0,
        currentPercent: prevPlayerFrame.percent ?? 0,
        deathAnimation: playerFrame.actionStateId,
      })),
    );
}
