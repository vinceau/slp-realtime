export interface EventConfig {
  id: string;
  type: string;
  filter?: Record<string, any>;
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
