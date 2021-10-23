import type { FrameEntryType } from "../types";
import { exists } from "./exists";

/**
 * Given the last frame of the game, determine the winner first based on stock count
 * then based on remaining percent.
 * If percents are tied, return the player with the lower port number by default.
 *
 * @returns the player index of the winner
 */
export const findWinner = (lastFrame: FrameEntryType): number => {
  const postFrameEntries = Object.keys(lastFrame.players)
    .map((i: any) => lastFrame.players[i]?.post)
    .filter(exists);

  const winnerPostFrame = postFrameEntries.reduce((a, b) => {
    if (!exists(a.stocksRemaining) || !exists(b.stocksRemaining) || !exists(a.percent) || !exists(b.percent)) {
      return a;
    }

    // Determine winner based on stock count
    if (a.stocksRemaining > b.stocksRemaining) {
      return a;
    }
    if (a.stocksRemaining < b.stocksRemaining) {
      return b;
    }

    // Stocks are the same so determine winner based off remaining percent
    if (a.percent < b.percent) {
      return a;
    }
    if (a.percent > b.percent) {
      return b;
    }

    // Just return a by default
    return a;
  });

  return winnerPostFrame.playerIndex as number;
};
