import type { GameStartType, MetadataType } from "@slippi/slippi-js";
import { get } from "lodash";

type PlayerNames = {
  name: string;
  code: string;
  tag: string;
};

export function extractNames(
  index: number,
  settings: Pick<GameStartType, "players">,
  metadata?: MetadataType | null,
): PlayerNames {
  const result: PlayerNames = {
    name: "",
    code: "",
    tag: "",
  };

  const player = settings.players.find((player) => player.playerIndex === index);
  result.tag = player?.nametag ?? "";
  result.name = player?.displayName || get(metadata, ["players", index, "names", "netplay"], "");
  result.code = player?.connectCode || get(metadata, ["players", index, "names", "code"], "");

  return result;
}

export function findPlayerIndexByName(
  settings: Pick<GameStartType, "players">,
  metadata: MetadataType | null,
  options: {
    namesToFind: string[];
    fuzzyMatch?: boolean;
  },
): number[] {
  const { namesToFind, fuzzyMatch } = options;
  const playerIndices = settings.players.map(({ playerIndex }) => playerIndex);
  return playerIndices.filter((i) => {
    const { name, tag, code } = extractNames(i, settings, metadata);
    const possibleNames = [name, tag, code].filter((n) => Boolean(n));
    return namesMatch(namesToFind, possibleNames, fuzzyMatch);
  });
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

export function extractPlayerNamesByPort(settings: GameStartType, metadata?: MetadataType | null): string[][] {
  return [0, 1, 2, 3].map((index) => {
    const nametags: string[] = [];
    const { name, code, tag } = extractNames(index, settings, metadata);
    if (name) {
      nametags.push(name);
    }
    if (code) {
      nametags.push(code);
    }
    if (tag) {
      nametags.push(tag);
    }
    return nametags;
  });
}

export function extractPlayerNames(settings: GameStartType, metadata?: MetadataType | null): string[] {
  return extractPlayerNamesByPort(settings, metadata).flat();
}
