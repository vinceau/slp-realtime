export interface EventConfig {
  id: string;
  type: string;
  filter?: Record<string, any>;
}

export interface EventManagerConfig {
  events: EventConfig[];
}

export interface EventEmit {
  id: string;
  payload?: any;
}
