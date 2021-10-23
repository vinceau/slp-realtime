import { SlippiGame } from "@slippi/slippi-js";
import { extractPlayerNames, namesMatch } from "../src";

describe("when extracting player names", () => {
  it("can correctly extract player names", () => {
    const game = new SlippiGame("slp/nametag-combos.slp");
    const settings = game.getSettings();
    const metadata = game.getMetadata();
    const matchableNames = extractPlayerNames(settings, metadata);
    expect(matchableNames.length).toEqual(2);
    expect(matchableNames.includes("PK")).toBeTruthy();
    expect(matchableNames.includes("GOGO")).toBeTruthy();

    const nameTagsToFind = ["PK"];
    expect(namesMatch(nameTagsToFind, matchableNames)).toBeTruthy();
  });
});
