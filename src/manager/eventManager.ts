import { SlpRealTime } from "../realtime";
import { ReplaySubject, Observable, merge } from "rxjs";
import { EventManagerConfig, EventEmit } from "./config";
import { switchMap } from "rxjs/operators";

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
        observables.push(this.realtime.game.readConfig(config.events));
        return merge(...observables);
      }),
    );
  }

}