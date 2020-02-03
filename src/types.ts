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

export enum ControllerInput {
  DPAD_LEFT = 0x0001,
  DPAD_RIGHT = 0x0002,
  DPAD_DOWN = 0x0004,
  DPAD_UP = 0x0008,
  Z_BUTTON = 0x0010,
  R_TRIGGER = 0x0020,
  L_TRIGGER = 0x0040,
  A_BUTTON = 0x0100,
  B_BUTTON = 0x0200,
  X_BUTTON = 0x0400,
  Y_BUTTON = 0x0800,
  START_BUTTON = 0x1000,
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
