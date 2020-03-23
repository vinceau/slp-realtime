import { SlpRealTime } from "../realtime";
import { ReplaySubject, Observable, merge } from "rxjs";
import { EventManagerConfig, EventEmit } from "./config";
import { switchMap } from "rxjs/operators";
import { readGameConfig, readInputsConfig, readStocksConfig } from "../filters";

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
      switchMap(config => {
        const observables = new Array<Observable<EventEmit>>();
        observables.push(readGameConfig(this.realtime.game, config));
        observables.push(readInputsConfig(this.realtime.input, config));
        observables.push(readStocksConfig(this.realtime.stock, config));
        return merge(...observables);
      }),
    );
  }

}