import type { ComboType, GameEndType, GameStartType } from "@slippi/slippi-js";

// Export the parameter types for events and SlippiGame for convenience
export {
  ComboType,
  ConversionType,
  FrameEntryType,
  Frames,
  GameEndType,
  GameStartType,
  PostFrameUpdateType,
  PreFrameUpdateType,
  StockType,
} from "@slippi/slippi-js";

export enum GameEndMethod {
  UNRESOLVED = 0,
  TIME = 1,
  GAME = 2,
  RESOLVED = 3,
  NO_CONTEST = 7,
}

export enum Input {
  D_LEFT = "D_LEFT",
  D_RIGHT = "D_RIGHT",
  D_DOWN = "D_DOWN",
  D_UP = "D_UP",
  Z = "Z",
  R = "R",
  L = "L",
  A = "A",
  B = "B",
  X = "X",
  Y = "Y",
  START = "START",
}

export interface PercentChange {
  playerIndex: number;
  percent: number;
}

export interface StockCountChange {
  playerIndex: number;
  stocksRemaining: number;
}

export interface ComboEventPayload {
  combo: ComboType;
  settings: GameStartType;
}

export interface InputButtonCombo {
  frame: number;
  playerIndex: number;
  combo: string[];
  duration: number;
}

export interface GameEndPayload extends GameEndType {
  winnerPlayerIndex: number;
}

export type PlayerIndexFilter = number | number[] | string;
