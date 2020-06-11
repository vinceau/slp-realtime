import { ComboFilterSettings } from "../utils";

export interface ComboEventFilter {
  playerIndex: number;
  comboCriteria: string | ComboFilterSettings;
}

export interface GameEventFilter {
  endMethod: number;
  winnerPlayerIndex: number;
}

export type EventFilter = ComboEventFilter | GameEventFilter;

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
