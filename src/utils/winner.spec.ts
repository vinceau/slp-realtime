import { FrameEntryType } from "@slippi/slippi-js";
import { findWinner } from "./winner";

describe("when calculating the game winner", () => {
  it("should choose the player with the most stocks", async () => {
    const lastFrame = generateLastFrame([
      {
        playerIndex: 0,
        percent: 100,
        stocksRemaining: 0,
      },
      {
        playerIndex: 1,
        percent: 100,
        stocksRemaining: 1,
      },
    ]);
    const winnerIndex = findWinner(lastFrame);
    expect(winnerIndex).toEqual(1);
  });

  it("should choose the player with the least percent if stocks are tied", async () => {
    const lastFrame = generateLastFrame([
      {
        playerIndex: 1,
        percent: 100,
        stocksRemaining: 1,
      },
      {
        playerIndex: 3,
        percent: 90,
        stocksRemaining: 1,
      },
    ]);
    const winnerIndex = findWinner(lastFrame);
    expect(winnerIndex).toEqual(3);

    const lastFrame2 = generateLastFrame([
      {
        playerIndex: 1,
        percent: 90,
        stocksRemaining: 1,
      },
      {
        playerIndex: 3,
        percent: 100,
        stocksRemaining: 1,
      },
    ]);
    const winnerIndex2 = findWinner(lastFrame2);
    expect(winnerIndex2).toEqual(1);
  });

  it("should choose the player with the lowest port number if stocks and percent are tied", async () => {
    const lastFrame = generateLastFrame([
      {
        playerIndex: 1,
        percent: 100,
        stocksRemaining: 1,
      },
      {
        playerIndex: 3,
        percent: 100,
        stocksRemaining: 1,
      },
    ]);
    const winnerIndex = findWinner(lastFrame);
    expect(winnerIndex).toEqual(1);
  });
});

interface PlayerInfo {
  playerIndex: number;
  percent: number;
  stocksRemaining: number;
}

const generateLastFrame = (playerInfo: PlayerInfo[]): FrameEntryType => {
  const players: any = {};
  for (let p of playerInfo) {
    players[p.playerIndex] = {
      post: p,
    };
  }
  const lastFrame: FrameEntryType = ({
    frame: 123,
    players,
  } as unknown) as FrameEntryType;
  return lastFrame;
};
