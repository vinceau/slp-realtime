import type { GameStartType, MetadataType } from "@slippi/slippi-js";
import get from "lodash/get";

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
  namesToFind: string[],
  settings: Pick<GameStartType, "players">,
  metadata?: MetadataType | null,
): number[] {
  const playerIndices = settings.players.map(({ playerIndex }) => playerIndex);
  return playerIndices.filter((i) => {
    const { name, tag, code } = extractNames(i, settings, metadata);
    const possibleNames = [name, tag, code].filter((n) => Boolean(n));
    for (const nameToFind of namesToFind) {
      if (possibleNames.includes(nameToFind)) {
        return true;
      }
    }
    return false;
  });
}
