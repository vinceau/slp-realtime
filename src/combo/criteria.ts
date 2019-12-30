import _ from "lodash";

import { Criteria } from "./filter";
import { MoveID } from "../melee/moves";
import { Character } from "../melee/characters";

/**
 * MatchesPortNumber ensures the player performing the combo is a specific port.
 * The port to be matched against is zero indexed. This means that player 1 is
 * has the index 0, and player 2 has the index 1 etc.
 */
export const MatchesPortNumber: Criteria = (combo, settings, options) => {
  const player = _.find(settings.players, (player) => player.playerIndex === combo.playerIndex);
  return options.portFilter.includes(player.playerIndex);
}

export const MatchesPlayerName: Criteria = (combo, settings, options) => {
  if (options.nameTags.length === 0) {
    return true;
  }

  const player = _.find(settings.players, (player) => player.playerIndex === combo.playerIndex);
  const playerTag = player.nametag || null;
  return options.nameTags.includes(playerTag);
}

export const MatchesCharacter: Criteria = (combo, settings, options) => {
  if (options.characterFilter.length === 0) {
    return true;
  }

  const player = _.find(settings.players, (player) => player.playerIndex === combo.playerIndex);
  const matchesCharacter = options.characterFilter.includes(player.characterId);
  return matchesCharacter;
}

export const ExcludesChainGrabs: Criteria = (combo, settings, options) => {
  if (!options.excludeChainGrabs) {
    return true;
  }

  const player = _.find(settings.players, (player) => player.playerIndex === combo.playerIndex);
  if (!options.chainGrabbers.includes(player.characterId)) {
    return true;
  }

  const numUpThrowPummels = combo.moves.filter(({ moveId }) => moveId === MoveID.U_THROW || moveId === MoveID.GRAB_PUMMEL).length;
  const numMoves = combo.moves.length;
  const isChainGrab = numUpThrowPummels / numMoves >= options.chainGrabThreshold;
  // Continue with processing if the combo is not a chain grab
  return !isChainGrab;
}

export const ExcludesWobbles: Criteria = (combo, settings, options) => {
  if (!options.excludeWobbles) {
    return true;
  }
         
  const player = _.find(settings.players, (player) => player.playerIndex === combo.playerIndex);
  if (player.characterId !== Character.ICE_CLIMBERS) {
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
  const wobbled = _.some(wobbles, (pummelCount) => pummelCount > options.wobbleThreshold);
  // Only continue processing if the combo is not a wobble
  return !wobbled;
}

export const SatisfiesMinComboLength: Criteria = (combo, settings, options) => {
  const numMoves = combo.moves.length;
  return numMoves >= options.minComboLength;
}

export const SatisfiesMinComboPercent: Criteria = (combo, settings, options) => {
  const player = _.find(settings.players, (player) => player.playerIndex === combo.playerIndex);

  const minComboPercent = options.perCharacterMinComboPercent[player.characterId] || options.minComboPercent;
  const totalComboPercent = combo.endPercent - combo.startPercent
  // Continue only if the total combo percent was greater than the threshold
  return totalComboPercent > minComboPercent;
}

export const ExcludesLargeSingleHit: Criteria = (combo, settings, options) => {
  const totalDmg = _.sumBy(combo.moves, ({ damage }) => damage);
  const largeSingleHit = _.some(combo.moves, ({ damage }) => damage / totalDmg >= options.largeHitThreshold);
  return !largeSingleHit;
}

export const ExcludesCPUs: Criteria = (combo, settings, options) => {
  if (!options.excludeCPUs) {
    return true;
  }
  const cpu = _.some(settings.players, (player) => player.type != 0)
  return !cpu;
}

export const IsOneVsOne: Criteria = (combo, settings) => {
  return settings.players.length === 2;
}

export const ComboDidKill: Criteria = (combo, settings, options) => {
  return !options.comboMustKill || combo.didKill;
}
