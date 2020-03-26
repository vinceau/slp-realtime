import { EventEmit, EventManagerConfig } from "../manager";
import { Observable } from "rxjs";

export interface EventsContainer {
  readConfig: (config: EventManagerConfig) => Observable<EventEmit>;
}