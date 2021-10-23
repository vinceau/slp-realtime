import type { EventEmit, EventManagerConfig } from "../manager";
import type { Observable } from "rxjs";

export interface EventsContainer {
  readConfig: (config: EventManagerConfig) => Observable<EventEmit>;
}
