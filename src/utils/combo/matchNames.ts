import { get } from "lodash";
import { GameStartType } from "../../types";

export function extractPlayerNamesByPort(settings: GameStartType, metadata?: any): string[][] {
  return [0, 1, 2, 3].map((index) => {
    const nametags: string[] = [];
    const player = settings.players.find((player) => player.playerIndex === index);
    const playerTag = player ? player.nametag : null;
    const netplayName: string | null =
      get(metadata, ["players", index, "names", "netplay"], null) ?? player.displayName;
    const netplayCode: string | null = get(metadata, ["players", index, "names", "code"], null) ?? player.connectCode;
    if (netplayName) {
      nametags.push(netplayName);
    }
    if (netplayCode) {
      nametags.push(netplayCode);
    }
    if (playerTag) {
      nametags.push(playerTag);
    }
    return nametags;
  });
}

export function extractPlayerNames(settings: GameStartType, metadata?: any): string[] {
  return extractPlayerNamesByPort(settings, metadata).flat();
}

export function namesMatch(lookingForNametags: string[], inGameTags: string[], fuzzyMatch?: boolean): boolean {
  if (lookingForNametags.length === 0 || inGameTags.length === 0) {
    return false;
  }

  const match = inGameTags.find((name) => {
    // If we're not doing fuzzy matching just return the exact match
    if (!fuzzyMatch) {
      return lookingForNametags.includes(name);
    }

    // Replace the netplay names with underscores and coerce to lowercase
    // Smashladder internally represents spaces as underscores when writing SLP files
    const fuzzyNetplayName = name.toLowerCase();
    const matchedFuzzyTag = lookingForNametags.find((tag) => {
      const lowerSearch = tag.toLowerCase();
      const fuzzySearch = tag.split(" ").join("_").toLowerCase();
      return lowerSearch === fuzzyNetplayName || fuzzySearch === fuzzyNetplayName;
    });
    return matchedFuzzyTag !== undefined;
  });

  return match !== undefined;
}
