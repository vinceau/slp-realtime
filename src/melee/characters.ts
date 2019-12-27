export type CharacterColor = string

export enum Character {
  CAPTAIN_FALCON = 0,
  DONKEY_KONG = 1,
  FOX = 2,
  GAME_AND_WATCH = 3,
  KIRBY = 4,
  BOWSER = 5,
  LINK = 6,
  LUIGI = 7,
  MARIO = 8,
  MARTH = 9,
  MEWTWO = 10,
  NESS = 11,
  PEACH = 12,
  PIKACHU = 13,
  ICE_CLIMBERS = 14,
  JIGGLYPUFF = 15,
  SAMUS = 16,
  YOSHI = 17,
  ZELDA = 18,
  SHEIK = 19,
  FALCO = 20,
  YOUNG_LINK = 21,
  DR_MARIO = 22,
  ROY = 23,
  PICHU = 24,
  GANONDORF = 25,
}

export interface CharacterInfo {
  id: number;
  name: string;
  shortName: string;
  colors: CharacterColor[];
}

const characterMap = new Map<Character, CharacterInfo>()
  .set(Character.CAPTAIN_FALCON, {
    id: Character.CAPTAIN_FALCON,
    name: "Captain Falcon",
    shortName: "falcon",
    colors: ["Default", "Black", "Red", "White", "Green", "Blue"],
  })
  .set(Character.DONKEY_KONG, {
    id: Character.DONKEY_KONG,
    name: "Donkey Kong",
    shortName: "dk",
    colors: ["Default", "Black", "Red", "Blue", "Green"],
  })
  .set(Character.FOX, {
    id: Character.FOX,
    name: "Fox",
    shortName: "fox",
    colors: ["Default", "Red", "Blue", "Green"],
  })
  .set(Character.GAME_AND_WATCH, {
    id: Character.GAME_AND_WATCH,
    name: "Mr. Game & Watch",
    shortName: "gnw",
    colors: ["Default", "Red", "Blue", "Green"],
  })
  .set(Character.KIRBY, {
    id: Character.KIRBY,
    name: "Kirby",
    shortName: "kirby",
    colors: ["Default", "Yellow", "Blue", "Red", "Green", "White"],
  })
  .set(Character.BOWSER, {
    id: Character.BOWSER,
    name: "Bowser",
    shortName: "bowser",
    colors: ["Default", "Red", "Blue", "Black"],
  })
  .set(Character.LINK, {
    id: Character.LINK,
    name: "Link",
    shortName: "link",
    colors: ["Default", "Red", "Blue", "Black", "White"],
  })
  .set(Character.LUIGI, {
    id: Character.LUIGI,
    name: "Luigi",
    shortName: "luigi",
    colors: ["Default", "White", "Blue", "Red"],
  })
  .set(Character.MARIO, {
    id: Character.MARIO,
    name: "Mario",
    shortName: "mario",
    colors: ["Default", "Yellow", "Black", "Blue", "Green"],
  })
  .set(Character.MARTH, {
    id: Character.MARTH,
    name: "Marth",
    shortName: "marth",
    colors: ["Default", "Red", "Green", "Black", "White"],
  })
  .set(Character.MEWTWO, {
    id: Character.MEWTWO,
    name: "Mewtwo",
    shortName: "mewtwo",
    colors: ["Default", "Red", "Blue", "Green"],
  })
  .set(Character.NESS, {
    id: Character.NESS,
    name: "Ness",
    shortName: "ness",
    colors: ["Default", "Yellow", "Blue", "Green"],
  })
  .set(Character.PEACH, {
    id: Character.PEACH,
    name: "Peach",
    shortName: "peach",
    colors: ["Default", "Daisy", "White", "Blue", "Green"],
  })
  .set(Character.PIKACHU, {
    id: Character.PIKACHU,
    name: "Pikachu",
    shortName: "pikachu",
    colors: ["Default", "Red", "Party Hat", "Cowboy Hat"],
  })
  .set(Character.ICE_CLIMBERS, {
    id: Character.ICE_CLIMBERS,
    name: "Ice Climbers",
    shortName: "ics",
    colors: ["Default", "Green", "Orange", "Red"],
  })
  .set(Character.JIGGLYPUFF, {
    id: Character.JIGGLYPUFF,
    name: "Jigglypuff",
    shortName: "puff",
    colors: ["Default", "Red", "Blue", "Headband", "Crown"],
  })
  .set(Character.SAMUS, {
    id: Character.SAMUS,
    name: "Samus",
    shortName: "samus",
    colors: ["Default", "Pink", "Black", "Green", "Purple"],
  })
  .set(Character.YOSHI, {
    id: Character.YOSHI,
    name: "Yoshi",
    shortName: "yoshi",
    colors: ["Default", "Red", "Blue", "Yellow", "Pink", "Cyan"],
  })
  .set(Character.ZELDA, {
    id: Character.ZELDA,
    name: "Zelda",
    shortName: "zelda",
    colors: ["Default", "Red", "Blue", "Green", "White"],
  })
  .set(Character.SHEIK, {
    id: Character.SHEIK,
    name: "Sheik",
    shortName: "sheik",
    colors: ["Default", "Red", "Blue", "Green", "White"],
  })
  .set(Character.FALCO, {
    id: Character.FALCO,
    name: "Falco",
    shortName: "falco",
    colors: ["Default", "Red", "Blue", "Green"],
  })
  .set(Character.YOUNG_LINK, {
    id: Character.YOUNG_LINK,
    name: "Young Link",
    shortName: "yl",
    colors: ["Default", "Red", "Blue", "White", "Black"],
  })
  .set(Character.DR_MARIO, {
    id: Character.DR_MARIO,
    name: "Dr. Mario",
    shortName: "doc",
    colors: ["Default", "Red", "Blue", "Green", "Black"],
  })
  .set(Character.ROY, {
    id: Character.ROY,
    name: "Roy",
    shortName: "roy",
    colors: ["Default", "Red", "Blue", "Green", "Yellow"],
  })
  .set(Character.PICHU, {
    id: Character.PICHU,
    name: "Pichu",
    shortName: "pichu",
    colors: ["Default", "Red", "Blue", "Green"],
  })
  .set(Character.GANONDORF, {
    id: Character.GANONDORF,
    name: "Ganondorf",
    shortName: "ganon",
    colors: ["Default", "Red", "Blue", "Green", "Purple"],
  });

export function getAllCharacters(): CharacterInfo[] {
  return Array.from(characterMap.values());
}

export function getCharacterInfo(externalCharacterId: number): CharacterInfo {
  const char = characterMap.get(externalCharacterId);
  if (!char) {
    throw new Error(`Invalid character id: ${externalCharacterId}`);
  }
  return char;
}

export function getCharacterShortName(externalCharacterId: number): string {
  const character = getCharacterInfo(externalCharacterId);
  return character.shortName;
}

export function getCharacterName(externalCharacterId: number): string {
  const character = getCharacterInfo(externalCharacterId);
  return character.name;
}

// Return a human-readable color from a characterCode.
export function getCharacterColorName(externalCharacterId: number, characterColor: number): CharacterColor {
  const character = getCharacterInfo(externalCharacterId);
  const colors = character.colors;
  return colors[characterColor];
}
