import { ComboType, GameStartType } from "slp-parser-js";

// Export the parameter types for events
export { GameStartType, GameEndType, ComboType, StockType, ConversionType } from "slp-parser-js";

export enum GameEndMethod {
  UNRESOLVED = 0,
  TIME = 1,
  GAME = 2,
  RESOLVED = 3,
  NO_CONTEST = 7,
};

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
};

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
  playerIndex: number;
  combo:  Input[];
  duration: number;
}
