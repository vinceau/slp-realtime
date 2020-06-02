export enum Stage {
  FOUNTAIN_OF_DREAMS = 2,
  POKEMON_STADIUM = 3,
  PEACHS_CASTLE = 4,
  KONGO_JUNGLE = 5,
  BRINSTAR = 6,
  CORNERIA = 7,
  YOSHIS_STORY = 8,
  ONETT = 9,
  MUTE_CITY = 10,
  RAINBOW_CRUISE = 11,
  JUNGLE_JAPES = 12,
  GREAT_BAY = 13,
  HYRULE_TEMPLE = 14,
  BRINSTAR_DEPTHS = 15,
  YOSHIS_ISLAND = 16,
  GREEN_GREENS = 17,
  FOURSIDE = 18,
  MUSHROOM_KINGDOM = 19,
  MUSHROOM_KINGDOM_2 = 20,
  VENOM = 22,
  POKE_FLOATS = 23,
  BIG_BLUE = 24,
  ICICLE_MOUNTAIN = 25,
  ICETOP = 26,
  FLAT_ZONE = 27,
  DREAMLAND = 28,
  YOSHIS_ISLAND_N64 = 29,
  KONGO_JUNGLE_N64 = 30,
  BATTLEFIELD = 31,
  FINAL_DESTINATION = 32,
}

export interface StageInfo {
  id: Stage;
  name: string;
  shortName?: string;
}

const stagesMap = new Map<Stage, StageInfo>()
  .set(Stage.FOUNTAIN_OF_DREAMS, {
    id: Stage.FOUNTAIN_OF_DREAMS,
    name: "Fountain of Dreams",
    shortName: "FoD",
  })
  .set(Stage.POKEMON_STADIUM, {
    id: Stage.POKEMON_STADIUM,
    name: "Pokémon Stadium",
    shortName: "PS",
  })
  .set(Stage.PEACHS_CASTLE, {
    id: Stage.PEACHS_CASTLE,
    name: "Princess Peach's Castle",
  })
  .set(Stage.KONGO_JUNGLE, {
    id: Stage.KONGO_JUNGLE,
    name: "Kongo Jungle",
  })
  .set(Stage.BRINSTAR, {
    id: Stage.BRINSTAR,
    name: "Brinstar",
  })
  .set(Stage.CORNERIA, {
    id: Stage.CORNERIA,
    name: "Corneria",
  })
  .set(Stage.YOSHIS_STORY, {
    id: Stage.YOSHIS_STORY,
    name: "Yoshi's Story",
    shortName: "YS",
  })
  .set(Stage.ONETT, {
    id: Stage.ONETT,
    name: "Onett",
  })
  .set(Stage.MUTE_CITY, {
    id: Stage.MUTE_CITY,
    name: "Mute City",
  })
  .set(Stage.RAINBOW_CRUISE, {
    id: Stage.RAINBOW_CRUISE,
    name: "Rainbow Cruise",
  })
  .set(Stage.JUNGLE_JAPES, {
    id: Stage.JUNGLE_JAPES,
    name: "Jungle Japes",
  })
  .set(Stage.GREAT_BAY, {
    id: Stage.GREAT_BAY,
    name: "Great Bay",
  })
  .set(Stage.HYRULE_TEMPLE, {
    id: Stage.HYRULE_TEMPLE,
    name: "Hyrule Temple",
  })
  .set(Stage.BRINSTAR_DEPTHS, {
    id: Stage.BRINSTAR_DEPTHS,
    name: "Brinstar Depths",
  })
  .set(Stage.YOSHIS_ISLAND, {
    id: Stage.YOSHIS_ISLAND,
    name: "Yoshi's Island",
  })
  .set(Stage.GREEN_GREENS, {
    id: Stage.GREEN_GREENS,
    name: "Green Greens",
  })
  .set(Stage.FOURSIDE, {
    id: Stage.FOURSIDE,
    name: "Fourside",
  })
  .set(Stage.MUSHROOM_KINGDOM, {
    id: Stage.MUSHROOM_KINGDOM,
    name: "Mushroom Kingdom I",
  })
  .set(Stage.MUSHROOM_KINGDOM_2, {
    id: Stage.MUSHROOM_KINGDOM_2,
    name: "Mushroom Kingdom II",
  })
  .set(Stage.VENOM, {
    id: Stage.VENOM,
    name: "Venom",
  })
  .set(Stage.POKE_FLOATS, {
    id: Stage.POKE_FLOATS,
    name: "Poké Floats",
  })
  .set(Stage.BIG_BLUE, {
    id: Stage.BIG_BLUE,
    name: "Big Blue",
  })
  .set(Stage.ICICLE_MOUNTAIN, {
    id: Stage.ICICLE_MOUNTAIN,
    name: "Icicle Mountain",
  })
  .set(Stage.ICETOP, {
    id: Stage.ICETOP,
    name: "Icetop",
  })
  .set(Stage.FLAT_ZONE, {
    id: Stage.FLAT_ZONE,
    name: "Flat Zone",
  })
  .set(Stage.DREAMLAND, {
    id: Stage.DREAMLAND,
    name: "Dream Land N64",
    shortName: "DL",
  })
  .set(Stage.YOSHIS_ISLAND_N64, {
    id: Stage.YOSHIS_ISLAND_N64,
    name: "Yoshi's Island N64",
  })
  .set(Stage.KONGO_JUNGLE_N64, {
    id: Stage.KONGO_JUNGLE_N64,
    name: "Kongo Jungle N64",
  })
  .set(Stage.BATTLEFIELD, {
    id: Stage.BATTLEFIELD,
    name: "Battlefield",
    shortName: "BF",
  })
  .set(Stage.FINAL_DESTINATION, {
    id: Stage.FINAL_DESTINATION,
    name: "Final Destination",
    shortName: "FD",
  });

export function getStageInfo(stageId: number): StageInfo {
  const s = stagesMap.get(stageId);
  if (!s) {
    throw new Error(`Invalid stage with id ${stageId}`);
  }
  return s;
}

export function getStageName(stageId: number): string {
  const stage = getStageInfo(stageId);
  return stage.name;
}

export function getStageShortName(stageId: number): string {
  const stage = getStageInfo(stageId);
  return stage.shortName || getStageName(stageId);
}
