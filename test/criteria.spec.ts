import { GameMode, MoveLandedType } from "@slippi/slippi-js";
import { ComboFilterSettings, defaultComboFilterSettings, IncludesComboSequence, MoveID } from "../src";
import { ComboType, GameStartType } from "../src/types";

const generateMoves = (moveIds: number[]): MoveLandedType[] => {
  const baseMove = { damage: 1, frame: 0, hitCount: 1, playerIndex: 1 };
  return moveIds.map((moveId) => Object.assign({}, baseMove, { moveId }));
};

describe("combo criteria", () => {
  describe("combo sequence inclusion", () => {
    let combo: ComboType;
    let options: ComboFilterSettings;
    const gameStartType: GameStartType = {
      gameMode: GameMode.ONLINE,
      isPAL: true,
      isTeams: false,
      players: [],
      scene: 0,
      slpVersion: "",
      stageId: 0,
    };

    beforeEach(() => {
      combo = {
        currentPercent: 0,
        didKill: false,
        moves: generateMoves([
          MoveID.D_AIR,
          MoveID.D_SPECIAL,
          MoveID.JAB_1,
          MoveID.U_AIR,
          MoveID.U_SMASH,
          MoveID.NEUTRAL_AIR,
          MoveID.U_SMASH,
        ]),
        playerIndex: 0,
        startFrame: 0,
        startPercent: 0,
        lastHitBy: null,
      };

      options = defaultComboFilterSettings;
    });

    it("succeeds when not set in options", () => {
      combo.moves = generateMoves([MoveID.F_SMASH]);

      expect(IncludesComboSequence(combo, gameStartType, options)).toBeTruthy();
    });

    it("fails when combo is shorter than the filter", () => {
      combo.moves = generateMoves([MoveID.F_SMASH]);
      options.includesComboSequence = {
        mode: "include",
        sequence: [MoveID.F_SMASH, MoveID.F_SMASH],
      };

      expect(IncludesComboSequence(combo, gameStartType, options)).toBeFalsy();
    });

    it("passes combos that include the given filter", () => {
      options.includesComboSequence = {
        mode: "include",
        sequence: [MoveID.D_SPECIAL, MoveID.JAB_1, MoveID.U_AIR, MoveID.U_SMASH],
      };

      expect(IncludesComboSequence(combo, gameStartType, options)).toBeTruthy();
    });

    it("defaults to 'includes' mode", () => {
      options.includesComboSequence = {
        sequence: [MoveID.D_SPECIAL, MoveID.JAB_1, MoveID.U_AIR, MoveID.U_SMASH],
      };

      expect(IncludesComboSequence(combo, gameStartType, options)).toBeTruthy();
    });

    it("fails combos that do not include the given filter", () => {
      options.includesComboSequence = {
        mode: "include",
        sequence: [MoveID.U_SMASH, MoveID.U_SMASH],
      };

      expect(IncludesComboSequence(combo, gameStartType, options)).toBeFalsy();
    });

    it("passes combos that start with the given filter", () => {
      options.includesComboSequence = {
        mode: "start",
        sequence: [MoveID.D_AIR, MoveID.D_SPECIAL, MoveID.JAB_1],
      };

      expect(IncludesComboSequence(combo, gameStartType, options)).toBeTruthy();
    });

    it("fails combos that do not start with the given filter", () => {
      options.includesComboSequence = {
        mode: "start",
        sequence: [MoveID.D_SPECIAL, MoveID.JAB_1, MoveID.U_AIR],
      };

      expect(IncludesComboSequence(combo, gameStartType, options)).toBeFalsy();
    });

    it("passes combos that end with the given filter", () => {
      options.includesComboSequence = {
        mode: "end",
        sequence: [MoveID.U_SMASH, MoveID.NEUTRAL_AIR, MoveID.U_SMASH],
      };

      expect(IncludesComboSequence(combo, gameStartType, options)).toBeTruthy();
    });

    it("fails combos that do not end with the given filter", () => {
      options.includesComboSequence = {
        mode: "end",
        sequence: [MoveID.U_AIR, MoveID.U_SMASH, MoveID.NEUTRAL_AIR],
      };

      expect(IncludesComboSequence(combo, gameStartType, options)).toBeFalsy();
    });

    it("passes combos that exactly match the given filter", () => {
      options.includesComboSequence = {
        mode: "exact",
        sequence: [
          MoveID.D_AIR,
          MoveID.D_SPECIAL,
          MoveID.JAB_1,
          MoveID.U_AIR,
          MoveID.U_SMASH,
          MoveID.NEUTRAL_AIR,
          MoveID.U_SMASH,
        ],
      };

      expect(IncludesComboSequence(combo, gameStartType, options)).toBeTruthy();
    });

    it("fails combos that do not exactly match the given filter", () => {
      options.includesComboSequence = {
        mode: "exact",
        sequence: [MoveID.D_AIR, MoveID.D_SPECIAL, MoveID.JAB_1, MoveID.U_SMASH, MoveID.NEUTRAL_AIR, MoveID.U_SMASH],
      };

      expect(IncludesComboSequence(combo, gameStartType, options)).toBeFalsy();
    });
  });
});
