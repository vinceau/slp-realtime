import _ from "lodash";

import { Criteria, ComboFilterSettings } from "./filter";
import { ComboType, GameStartType } from "slp-parser-js";
import { MoveID } from "../melee/moves";
import { Character } from "../melee/characters";

export class MatchesPlayerName implements Criteria {
  public check(combo: ComboType, settings: GameStartType, options: ComboFilterSettings): boolean {
    if (options.nameTags.length === 0) {
      return true;
    }
         
    const player = _.find(settings.players, (player) => player.playerIndex === combo.playerIndex);
    options.nameTags.forEach((filterName) => {
      const playerTag = player.nametag || null;
      if (playerTag === filterName) {
        // Continue processing if it matches the name tag
        return true;
      }
    });
    // Combo did not match a name
    return false;
  }
}

export class ExcludesChainGrabs implements Criteria {
  public check(combo: ComboType, settings: GameStartType, options: ComboFilterSettings): boolean {
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
}

export class ExcludesWobbles implements Criteria {
  public check(combo: ComboType, settings: GameStartType, options: ComboFilterSettings): boolean {
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
}

export class SatisfiesMinComboPercent implements Criteria {
  public check(combo: ComboType, settings: GameStartType, options: ComboFilterSettings): boolean {
    const player = _.find(settings.players, (player) => player.playerIndex === combo.playerIndex);

    const minComboPercent = options.perCharacterMinComboPercent[player.characterId] || options.minComboPercent;
    const totalComboPercent = combo.endPercent - combo.startPercent
    // Continue only if the total combo percent was greater than the threshold
    return totalComboPercent > minComboPercent;
  }
}

export class ExcludesLargeSingleHit implements Criteria {
  public check(combo: ComboType, settings: GameStartType, options: ComboFilterSettings): boolean {
    const totalDmg = _.sumBy(combo.moves, ({ damage }) => damage);
    const largeSingleHit = _.some(combo.moves, ({ damage }) => damage / totalDmg >= options.largeHitThreshold);
    return !largeSingleHit;
  }
}

export class ExcludesCPUs implements Criteria {
  public check(combo: ComboType, settings: GameStartType): boolean {
    const cpu = _.some(settings.players, (player) => player.type != 0)
    return !cpu;
  }
}

export class IsOneVsOne implements Criteria {
  public check(combo: ComboType, settings: GameStartType): boolean {
    return settings.players.length === 2;
  }
}

export class ComboDidKill implements Criteria {
  public check(combo: ComboType, settings: GameStartType, options: ComboFilterSettings): boolean {
    return !options.comboMustKill || combo.didKill;
  }
}
