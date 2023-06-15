import { PlayerType } from "@slippi/slippi-js";
import { findPlayerIndexByName } from "./names";

describe("when finding player indices by name", () => {
  it("should not return any results when names to find list is empty", () => {
    const settings = {
      players: [
        generateFakePlayer({ playerIndex: 0 }),
        generateFakePlayer({ playerIndex: 1 }),
        generateFakePlayer({ playerIndex: 2 }),
        generateFakePlayer({ playerIndex: 3 }),
      ],
    };
    const result = findPlayerIndexByName(settings, null, { namesToFind: [] });
    expect(result.length).toEqual(0);
  });

  it("should not return any results when names do not match", () => {
    const settings = {
      players: [
        generateFakePlayer({ playerIndex: 0 }),
        generateFakePlayer({ playerIndex: 1 }),
        generateFakePlayer({ playerIndex: 2 }),
        generateFakePlayer({ playerIndex: 3 }),
      ],
    };
    const result = findPlayerIndexByName(settings, null, { namesToFind: ["thisshouldreturnnothing"] });
    expect(result.length).toEqual(0);
  });

  it("should match exact display names", () => {
    const settings = {
      players: [
        generateFakePlayer({ playerIndex: 0, displayName: "player1" }),
        generateFakePlayer({ playerIndex: 1, displayName: "player2" }),
      ],
    };
    const result = findPlayerIndexByName(settings, null, { namesToFind: ["player1"] });
    expect(result.length).toEqual(1);
    expect(result[0]).toEqual(0);
  });

  it("should match exact connect codes", () => {
    const settings = {
      players: [
        generateFakePlayer({ playerIndex: 0, connectCode: "CODE#001" }),
        generateFakePlayer({ playerIndex: 1, connectCode: "CODE#002" }),
      ],
    };
    const result = findPlayerIndexByName(settings, null, { namesToFind: ["CODE#001"] });
    expect(result.length).toEqual(1);
    expect(result[0]).toEqual(0);
  });

  it("should match exact in game tags", () => {
    const settings = {
      players: [
        generateFakePlayer({ playerIndex: 0, nametag: "foo" }),
        generateFakePlayer({ playerIndex: 1, nametag: "bar" }),
      ],
    };
    const result = findPlayerIndexByName(settings, null, { namesToFind: ["bar"] });
    expect(result.length).toEqual(1);
    expect(result[0]).toEqual(1);
  });

  it("should match the same search term in name tag, display name, and connect code", () => {
    const settings = {
      players: [
        generateFakePlayer({ playerIndex: 0, nametag: "foo" }),
        generateFakePlayer({ playerIndex: 1, displayName: "foo" }),
        generateFakePlayer({ playerIndex: 2, connectCode: "foo" }),
        generateFakePlayer({ playerIndex: 3 }),
      ],
    };
    const result = findPlayerIndexByName(settings, null, { namesToFind: ["foo"] });
    expect(result.length).toEqual(3);
    expect(result).toContainEqual(0);
    expect(result).toContainEqual(1);
    expect(result).toContainEqual(2);
  });

  it("should match multiple search terms", () => {
    const settings = {
      players: [
        generateFakePlayer({ playerIndex: 0 }),
        generateFakePlayer({ playerIndex: 1, displayName: "foo" }),
        generateFakePlayer({ playerIndex: 2, connectCode: "bar" }),
        generateFakePlayer({ playerIndex: 3, nametag: "baz" }),
      ],
    };
    const result = findPlayerIndexByName(settings, null, { namesToFind: ["foo", "bar", "baz"] });
    expect(result.length).toEqual(3);
    expect(result).toContainEqual(1);
    expect(result).toContainEqual(2);
    expect(result).toContainEqual(3);
  });

  describe("when fuzzy search is on", () => {
    it("should match names with different casing", () => {
      const settings = {
        players: [
          generateFakePlayer({ playerIndex: 0, displayName: "player1" }),
          generateFakePlayer({ playerIndex: 1, displayName: "player2" }),
        ],
      };
      const result = findPlayerIndexByName(settings, null, { namesToFind: ["PlAyEr2"], fuzzyMatch: true });
      expect(result.length).toEqual(1);
      expect(result[0]).toEqual(1);
    });
  });
});

const generateFakePlayer = ({ playerIndex = 0, ...opts }: Partial<Omit<PlayerType, "port">>): PlayerType => {
  const port = playerIndex + 1;
  return {
    playerIndex,
    port,
    characterId: 1,
    characterColor: 1,
    startStocks: 4,
    type: 1, // 0 means CPU
    teamId: null,
    controllerFix: null,
    nametag: `tag${port}`,
    displayName: `player${port}`,
    connectCode: `CODE#00${port}`,
    ...opts,
  };
};
