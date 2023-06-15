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

export enum MoveId {
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

const allMoves = new Map<MoveId, Move>()
  .set(MoveId.MISC, {
    // This includes all thrown items, zair, luigi's taunt, samus bombs, etc
    id: MoveId.MISC,
    name: "Miscellaneous",
    shortName: "misc",
  })
  .set(MoveId.JAB_1, {
    id: MoveId.JAB_1,
    name: "Jab",
    shortName: "jab",
  })
  .set(MoveId.JAB_2, {
    id: MoveId.JAB_2,
    name: "Jab",
    shortName: "jab",
  })
  .set(MoveId.JAB_3, {
    id: MoveId.JAB_3,
    name: "Jab",
    shortName: "jab",
  })
  .set(MoveId.RAPID_JABS, {
    id: MoveId.RAPID_JABS,
    name: "Rapid Jabs",
    shortName: "rapid-jabs",
  })
  .set(MoveId.DASH_ATTACK, {
    id: MoveId.DASH_ATTACK,
    name: "Dash Attack",
    shortName: "dash",
  })
  .set(MoveId.F_TILT, {
    id: MoveId.F_TILT,
    name: "Forward Tilt",
    shortName: "ftilt",
  })
  .set(MoveId.U_TILT, {
    id: MoveId.U_TILT,
    name: "Up Tilt",
    shortName: "utilt",
  })
  .set(MoveId.D_TILT, {
    id: MoveId.D_TILT,
    name: "Down Tilt",
    shortName: "dtilt",
  })
  .set(MoveId.F_SMASH, {
    id: MoveId.F_SMASH,
    name: "Forward Smash",
    shortName: "fsmash",
  })
  .set(MoveId.U_SMASH, {
    id: MoveId.U_SMASH,
    name: "Up Smash",
    shortName: "usmash",
  })
  .set(MoveId.D_SMASH, {
    id: MoveId.D_SMASH,
    name: "Down Smash",
    shortName: "dsmash",
  })
  .set(MoveId.NEUTRAL_AIR, {
    id: MoveId.NEUTRAL_AIR,
    name: "Neutral Air",
    shortName: "nair",
  })
  .set(MoveId.F_AIR, {
    id: MoveId.F_AIR,
    name: "Forward Air",
    shortName: "fair",
  })
  .set(MoveId.B_AIR, {
    id: MoveId.B_AIR,
    name: "Back Air",
    shortName: "bair",
  })
  .set(MoveId.U_AIR, {
    id: MoveId.U_AIR,
    name: "Up Air",
    shortName: "uair",
  })
  .set(MoveId.D_AIR, {
    id: MoveId.D_AIR,
    name: "Down Air",
    shortName: "dair",
  })
  .set(MoveId.NEUTRAL_SPECIAL, {
    id: MoveId.NEUTRAL_SPECIAL,
    name: "Neutral B",
    shortName: "neutral-b",
  })
  .set(MoveId.F_SPECIAL, {
    id: MoveId.F_SPECIAL,
    name: "Side B",
    shortName: "side-b",
  })
  .set(MoveId.U_SPECIAL, {
    id: MoveId.U_SPECIAL,
    name: "Up B",
    shortName: "up-b",
  })
  .set(MoveId.D_SPECIAL, {
    id: MoveId.D_SPECIAL,
    name: "Down B",
    shortName: "down-b",
  })
  .set(MoveId.GETUP, {
    id: MoveId.GETUP,
    name: "Getup Attack",
    shortName: "getup",
  })
  .set(MoveId.GETUP_SLOW, {
    id: MoveId.GETUP_SLOW,
    name: "Getup Attack (Slow)",
    shortName: "getup-slow",
  })
  .set(MoveId.GRAB_PUMMEL, {
    id: MoveId.GRAB_PUMMEL,
    name: "Grab Pummel",
    shortName: "pummel",
  })
  .set(MoveId.F_THROW, {
    id: 53,
    name: "Forward Throw",
    shortName: "fthrow",
  })
  .set(MoveId.B_THROW, {
    id: MoveId.B_THROW,
    name: "Back Throw",
    shortName: "bthrow",
  })
  .set(MoveId.U_THROW, {
    id: MoveId.U_THROW,
    name: "Up Throw",
    shortName: "uthrow",
  })
  .set(MoveId.D_THROW, {
    id: MoveId.D_THROW,
    name: "Down Throw",
    shortName: "dthrow",
  })
  .set(MoveId.EDGE_SLOW, {
    id: MoveId.EDGE_SLOW,
    name: "Edge Attack (Slow)",
    shortName: "edge-slow",
  })
  .set(MoveId.EDGE, {
    id: MoveId.EDGE,
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
