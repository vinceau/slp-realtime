import { getCharacterInfo, getAllCharacters, getCharacterName, getCharacterShortName } from "./characters";
import { Character } from "@slippi/slippi-js";

describe("Melee character util functions", () => {
  it("should return the list of all characters", async () => {
    const chars = getAllCharacters();
    expect(chars.length).toBeGreaterThan(0);
  });

  it("should return character information", async () => {
    const cfInfo = getCharacterInfo(Character.CAPTAIN_FALCON);
    expect(cfInfo.name).toEqual("Captain Falcon");
    const ganonInfo = getCharacterInfo(Character.GANONDORF);
    expect(ganonInfo.name).toEqual("Ganondorf");

    // Negative test
    expect(() => {
      getCharacterInfo(-1);
    }).toThrowError(/Invalid character id/);
  });

  it("should return character names", async () => {
    const cfName = getCharacterName(Character.CAPTAIN_FALCON);
    expect(cfName).toEqual("Captain Falcon");
    expect(getCharacterShortName(Character.CAPTAIN_FALCON)).toEqual("Falcon");

    const ganonName = getCharacterName(Character.GANONDORF);
    expect(ganonName).toEqual("Ganondorf");
    expect(getCharacterShortName(Character.GANONDORF)).toEqual("Ganon");

    expect(getCharacterShortName(Character.FOX)).toEqual(getCharacterName(Character.FOX));
  });
});
