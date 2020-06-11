import { ComboFilterSettings } from "../utils";
import { PlayerIndexFilter } from "../types";

export interface ComboEventFilter {
  playerIndex: PlayerIndexFilter;
  comboCriteria: string | ComboFilterSettings;
}

export interface GameEventFilter {
  winnerPlayerIndex: PlayerIndexFilter;
  endMethod: number;
}

export interface InputEventFilter {
  playerIndex: PlayerIndexFilter;
  combo: string[];
  duration: number;
}

export interface StockEventFilter {
  playerIndex: PlayerIndexFilter;
}

export type EventFilter = ComboEventFilter | GameEventFilter | InputEventFilter | StockEventFilter;

export interface EventConfig {
  id: string;
  type: string;
  filter?: EventFilter;
}

export type EventManagerVariables = Partial<{
  playerIndex: number;
}> &
  Record<string, any>;

export interface EventManagerConfig {
  variables?: EventManagerVariables;
  events: EventConfig[];
}

export interface EventEmit {
  id: string;
  payload?: any;
}
