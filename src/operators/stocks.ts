import { isDead } from "@slippi/slippi-js";
import { GameStartType, PostFrameUpdateType, StockType, FrameEntryType } from "../types";
import { Observable, OperatorFunction, MonoTypeOperatorFunction, merge } from "rxjs";
import { withLatestFrom, map, filter } from "rxjs/operators";
import { filterOnlyFirstFrame, withPreviousFrame, playerFrameFilter } from "./frames";

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
        const prevActionState = prevFrame.players[playerIndex].post.actionStateId;
        const currActionState = latestFrame.players[playerIndex].post.actionStateId;
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
      map(([frame, settings]) => {
        const player = settings.players.find((player) => player.playerIndex === playerIndex);
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
        endPercent: prevPlayerFrame.percent || 0,
        currentPercent: prevPlayerFrame.percent || 0,
        deathAnimation: playerFrame.actionStateId,
      })),
    );
}
