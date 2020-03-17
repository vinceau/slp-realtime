export interface EventConfig {
  id: string;
  type: string;
  filter?: any;
}

export interface EventManagerConfig {
  events: EventConfig[];
}

export interface EventEmit {
  id: string;
  payload?: any;
}
