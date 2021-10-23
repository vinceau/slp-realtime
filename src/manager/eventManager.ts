import type { SlpRealTime } from "../realtime";
import type { Observable } from "rxjs";
import { ReplaySubject, merge } from "rxjs";
import type { EventManagerConfig, EventEmit } from "./types";
import { switchMap } from "rxjs/operators";
import { readGameConfig } from "./game";
import { readInputsConfig } from "./inputs";
import { readStocksConfig } from "./stocks";
import { readComboConfig } from "./combo";

export class EventManager {
  public realtime: SlpRealTime;
  public events$: Observable<EventEmit>;
  private config$ = new ReplaySubject<EventManagerConfig>();

  public constructor(realtime: SlpRealTime) {
    this.realtime = realtime;
    this.events$ = this.setupSubscriptions();
  }

  public updateConfig(config: EventManagerConfig): void {
    this.config$.next(config);
  }

  private setupSubscriptions(): Observable<EventEmit> {
    return this.config$.pipe(
      switchMap((config) => {
        return merge(
          readGameConfig(this.realtime.game, config),
          readInputsConfig(this.realtime.input, config),
          readStocksConfig(this.realtime.stock, config),
          readComboConfig(this.realtime.combo, config),
        );
      }),
    );
  }
}
