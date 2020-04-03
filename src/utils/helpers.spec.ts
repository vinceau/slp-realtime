import { FrameEntryType } from "slp-parser-js";

import { findWinner } from "./helpers";

describe("when calculating the game winner", () => {

    it("should choose the player with the most stocks", async () => {
        const lastFrame: FrameEntryType = {
            frame: 123,
            players: {
                0: {
                    post: {
                        frame: 123,
                        playerIndex: 0,
                        percent: 100,
                        stocksRemaining: 0,
                    },

                },
                1: {
                    post: {
                        frame: 123,
                        playerIndex: 1,
                        percent: 100,
                        stocksRemaining: 1,
                    },

                },
            },
        } as unknown as FrameEntryType;
        const winnerIndex = findWinner(lastFrame);
        expect(winnerIndex).toEqual(1);
    });

    it("should choose the player with the least percent if stocks are tied", async () => {
        const lastFrame: FrameEntryType = {
            frame: 123,
            players: {
                1: {
                    post: {
                        frame: 123,
                        playerIndex: 1,
                        percent: 100,
                        stocksRemaining: 1,
                    },

                },
                3: {
                    post: {
                        frame: 123,
                        playerIndex: 3,
                        percent: 90,
                        stocksRemaining: 1,
                    },

                },
            },
        } as unknown as FrameEntryType;
        const winnerIndex = findWinner(lastFrame);
        expect(winnerIndex).toEqual(3);
    });

    it("should choose the player with the lowest port number if stocks and percent are tied", async () => {
        const lastFrame: FrameEntryType = {
            frame: 123,
            players: {
                1: {
                    post: {
                        frame: 123,
                        playerIndex: 1,
                        percent: 100,
                        stocksRemaining: 1,
                    },

                },
                3: {
                    post: {
                        frame: 123,
                        playerIndex: 3,
                        percent: 100,
                        stocksRemaining: 1,
                    },

                },
            },
        } as unknown as FrameEntryType;
        const winnerIndex = findWinner(lastFrame);
        expect(winnerIndex).toEqual(1);
    });
});
