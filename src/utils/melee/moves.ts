export interface Move {
  id: number;
  name: string;
  shortName: string;
}

export const UnknownMove: Move = {
  id: -1,
  name: "Unknown Move",
  shortName: "unknown",
};

export enum MoveID {
  MISC = 1,
  JAB_1 = 2,
  JAB_2 = 3,
  JAB_3 = 4,
  RAPID_JABS = 5,
  DASH_ATTACK = 6,
  F_TILT = 7,
  U_TILT = 8,
  D_TILT = 9,
  F_SMASH = 10,
  U_SMASH = 11,
  D_SMASH = 12,
  NEUTRAL_AIR = 13,
  F_AIR = 14,
  B_AIR = 15,
  U_AIR = 16,
  D_AIR = 17,
  NEUTRAL_SPECIAL = 18,
  F_SPECIAL = 19,
  U_SPECIAL = 20,
  D_SPECIAL = 21,
  GETUP = 50,
  GETUP_SLOW = 51,
  GRAB_PUMMEL = 52,
  F_THROW = 53,
  B_THROW = 54,
  U_THROW = 55,
  D_THROW = 56,
  EDGE_SLOW = 61,
  EDGE = 62,
}

const allMoves = new Map<MoveID, Move>()
  .set(MoveID.MISC, {
    // This includes all thrown items, zair, luigi's taunt, samus bombs, etc
    id: MoveID.MISC,
    name: "Miscellaneous",
    shortName: "misc",
  })
  .set(MoveID.JAB_1, {
    id: MoveID.JAB_1,
    name: "Jab",
    shortName: "jab",
  })
  .set(MoveID.JAB_2, {
    id: MoveID.JAB_2,
    name: "Jab",
    shortName: "jab",
  })
  .set(MoveID.JAB_3, {
    id: MoveID.JAB_3,
    name: "Jab",
    shortName: "jab",
  })
  .set(MoveID.RAPID_JABS, {
    id: MoveID.RAPID_JABS,
    name: "Rapid Jabs",
    shortName: "rapid-jabs",
  })
  .set(MoveID.DASH_ATTACK, {
    id: MoveID.DASH_ATTACK,
    name: "Dash Attack",
    shortName: "dash",
  })
  .set(MoveID.F_TILT, {
    id: MoveID.F_TILT,
    name: "Forward Tilt",
    shortName: "ftilt",
  })
  .set(MoveID.U_TILT, {
    id: MoveID.U_TILT,
    name: "Up Tilt",
    shortName: "utilt",
  })
  .set(MoveID.D_TILT, {
    id: MoveID.D_TILT,
    name: "Down Tilt",
    shortName: "dtilt",
  })
  .set(MoveID.F_SMASH, {
    id: MoveID.F_SMASH,
    name: "Forward Smash",
    shortName: "fsmash",
  })
  .set(MoveID.U_SMASH, {
    id: MoveID.U_SMASH,
    name: "Up Smash",
    shortName: "usmash",
  })
  .set(MoveID.D_SMASH, {
    id: MoveID.D_SMASH,
    name: "Down Smash",
    shortName: "dsmash",
  })
  .set(MoveID.NEUTRAL_AIR, {
    id: MoveID.NEUTRAL_AIR,
    name: "Neutral Air",
    shortName: "nair",
  })
  .set(MoveID.F_AIR, {
    id: MoveID.F_AIR,
    name: "Forward Air",
    shortName: "fair",
  })
  .set(MoveID.B_AIR, {
    id: MoveID.B_AIR,
    name: "Back Air",
    shortName: "bair",
  })
  .set(MoveID.U_AIR, {
    id: MoveID.U_AIR,
    name: "Up Air",
    shortName: "uair",
  })
  .set(MoveID.D_AIR, {
    id: MoveID.D_AIR,
    name: "Down Air",
    shortName: "dair",
  })
  .set(MoveID.NEUTRAL_SPECIAL, {
    id: MoveID.NEUTRAL_SPECIAL,
    name: "Neutral B",
    shortName: "neutral-b",
  })
  .set(MoveID.F_SPECIAL, {
    id: MoveID.F_SPECIAL,
    name: "Side B",
    shortName: "side-b",
  })
  .set(MoveID.U_SPECIAL, {
    id: MoveID.U_SPECIAL,
    name: "Up B",
    shortName: "up-b",
  })
  .set(MoveID.D_SPECIAL, {
    id: MoveID.D_SPECIAL,
    name: "Down B",
    shortName: "down-b",
  })
  .set(MoveID.GETUP, {
    id: MoveID.GETUP,
    name: "Getup Attack",
    shortName: "getup",
  })
  .set(MoveID.GETUP_SLOW, {
    id: MoveID.GETUP_SLOW,
    name: "Getup Attack (Slow)",
    shortName: "getup-slow",
  })
  .set(MoveID.GRAB_PUMMEL, {
    id: MoveID.GRAB_PUMMEL,
    name: "Grab Pummel",
    shortName: "pummel",
  })
  .set(MoveID.F_THROW, {
    id: 53,
    name: "Forward Throw",
    shortName: "fthrow",
  })
  .set(MoveID.B_THROW, {
    id: MoveID.B_THROW,
    name: "Back Throw",
    shortName: "bthrow",
  })
  .set(MoveID.U_THROW, {
    id: MoveID.U_THROW,
    name: "Up Throw",
    shortName: "uthrow",
  })
  .set(MoveID.D_THROW, {
    id: MoveID.D_THROW,
    name: "Down Throw",
    shortName: "dthrow",
  })
  .set(MoveID.EDGE_SLOW, {
    id: MoveID.EDGE_SLOW,
    name: "Edge Attack (Slow)",
    shortName: "edge-slow",
  })
  .set(MoveID.EDGE, {
    id: MoveID.EDGE,
    name: "Edge Attack",
    shortName: "edge",
  });

export function getMoveInfo(moveId: number): Move {
  const m = allMoves.get(moveId);
  if (!m) {
    return UnknownMove;
  }
  return m;
}

export function getMoveShortName(moveId: number): string {
  const move = getMoveInfo(moveId);
  return move.shortName;
}

export function getMoveName(moveId: number): string {
  const move = getMoveInfo(moveId);
  return move.name;
}
