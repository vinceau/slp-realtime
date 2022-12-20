import { sumBy } from "lodash";

import type { ComboType, GameStartType } from "../../types";
import { isEquivalentArray } from "../helpers";
import { Character, MoveID } from "../melee";
import type { Criteria } from "./filter";
import { extractPlayerNamesByPort, namesMatch } from "./matchNames";

/**
 * MatchesPortNumber ensures the player performing the combo is a specific port.
 */
export const MatchesPortNumber: Criteria = (combo, _settings, options) => {
  const move = combo.moves.find((move) => options.portFilter.includes(move.playerIndex + 1));
  return Boolean(move);
};

export const MatchesPlayerName: Criteria = (combo, settings, options, metadata) => {
  if (options.nameTags.length === 0) {
    return true;
  }

  const allMatchableNames = extractPlayerNamesByPort(settings, metadata);
  const uniquePlayerIds = new Set(combo.moves.map((move) => move.playerIndex));
  const match = Array.from(uniquePlayerIds).find((playerIndex) => {
    const matchableNames = allMatchableNames[playerIndex];
    if (matchableNames.length === 0) {
      // We're looking for a nametag but we have nothing to match against
      return false;
    }

    return namesMatch(options.nameTags, matchableNames, options.fuzzyNameTagMatching);
  });
  return match !== undefined;
};

export const MatchesCharacter: Criteria = (combo, settings, options) => {
  return comboMatchesCharacter(combo, settings, options.characterFilter);
};

const comboMatchesCharacter = (combo: ComboType, settings: GameStartType, characterFilter: number[]) => {
  if (characterFilter.length === 0) {
    return true;
  }

  const matches = combo.moves.find((move) => {
    const player = settings.players.find((player) => player.playerIndex === move.playerIndex);
    if (!player || player.characterId === null) {
      return false;
    }
    return characterFilter.includes(player.characterId);
  });

  return Boolean(matches);
};

export const ExcludesChainGrabs: Criteria = (combo, settings, options) => {
  if (!options.excludeChainGrabs) {
    return true;
  }

  if (!comboMatchesCharacter(combo, settings, options.chainGrabbers)) {
    return true;
  }

  const numUpThrowPummels = combo.moves.filter(
    ({ moveId }) => moveId === MoveID.U_THROW || moveId === MoveID.GRAB_PUMMEL,
  ).length;
  const numMoves = combo.moves.length;
  const isChainGrab = numUpThrowPummels / numMoves >= options.chainGrabThreshold;
  // Continue with processing if the combo is not a chain grab
  return !isChainGrab;
};

export const ExcludesWobbles: Criteria = (combo, settings, options) => {
  if (!options.excludeWobbles) {
    return true;
  }

  if (!comboMatchesCharacter(combo, settings, [Character.ICE_CLIMBERS])) {
    // Continue processing if the character is not Ice Climbers
    return true;
  }

  const wobbles = [];
  let pummels = 0;
  combo.moves.forEach(({ moveId }) => {
    if (moveId === MoveID.GRAB_PUMMEL) {
      pummels++;
    } else {
      wobbles.push(pummels);
      pummels = 0;
    }
  });
  wobbles.push(pummels);
  const wobbled = wobbles.some((pummelCount) => pummelCount > options.wobbleThreshold);
  // Only continue processing if the combo is not a wobble
  return !wobbled;
};

export const SatisfiesMinComboLength: Criteria = (combo, _settings, options) => {
  const numMoves = combo.moves.length;
  return numMoves >= options.minComboLength;
};

export const SatisfiesMinComboPercent: Criteria = (combo, settings, options) => {
  if (settings.players.length !== 2) {
    return true;
  }

  const move = combo.moves.find((move) => move.playerIndex !== combo.playerIndex);
  if (!move) {
    return false;
  }

  const player = settings.players.find((p) => p.playerIndex === move.playerIndex);
  if (!player || player.characterId === null) {
    return false;
  }
  const minComboPercent = options.perCharacterMinComboPercent[player.characterId] || options.minComboPercent;
  const totalComboPercent =
    combo.endPercent === null || combo.endPercent === undefined
      ? combo.startPercent
      : combo.endPercent - combo.startPercent;
  // Continue only if the total combo percent was greater than the threshold
  return totalComboPercent > minComboPercent;
};

export const ExcludesLargeSingleHit: Criteria = (combo, _settings, options) => {
  const totalDmg = sumBy(combo.moves, ({ damage }) => damage);
  const largeSingleHit = combo.moves.some(({ damage }) => damage / totalDmg >= options.largeHitThreshold);
  return !largeSingleHit;
};

export const ExcludesCPUs: Criteria = (_combo, settings, options) => {
  if (!options.excludeCPUs) {
    return true;
  }
  const cpu = settings.players.some((player) => player.type != 0);
  return !cpu;
};

export const IsOneVsOne: Criteria = (_combo, settings) => {
  return settings.players.length === 2;
};

export const ComboDidKill: Criteria = (combo, _settings, options) => {
  return !options.comboMustKill || combo.didKill;
};

const isIncludedInCombo = (comboMoves: number[], filterSequence: number[]): boolean => {
  for (let i = 0; i < comboMoves.length - filterSequence.length + 1; i++) {
    if (
      comboMoves[i] === filterSequence[0] &&
      isEquivalentArray(comboMoves.slice(i, i + filterSequence.length), filterSequence)
    ) {
      return true;
    }
  }

  return false;
};

export const IncludesComboSequence: Criteria = (combo, _, options) => {
  const { sequence, mode = "include" } = options.includesComboSequence;
  const moves = combo.moves.map((move) => move.moveId);

  if (!sequence || sequence.length === 0) {
    return true;
  }
  if (moves.length < sequence.length) {
    return false;
  }

  switch (mode) {
    case "start":
      return isEquivalentArray(moves.slice(0, sequence.length), sequence);
    case "end":
      return isEquivalentArray(moves.slice(moves.length - sequence.length), sequence);
    case "exact":
      return isEquivalentArray(moves, sequence);
    case "include":
      return isIncludedInCombo(moves, sequence);
    default:
      // Invalid mode so we're just going to ignore this particular criteria.
      return true;
  }
};

export const ALL_CRITERIA: Criteria[] = [
  MatchesPortNumber,
  MatchesPlayerName,
  MatchesCharacter,
  ExcludesChainGrabs,
  ExcludesWobbles,
  SatisfiesMinComboLength,
  SatisfiesMinComboPercent,
  ExcludesLargeSingleHit,
  ExcludesCPUs,
  IsOneVsOne,
  ComboDidKill,
  IncludesComboSequence,
];
