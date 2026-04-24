import type { ConversionType, GameStartType } from "@slippi/slippi-js";
import { ConversionComputer } from "@slippi/slippi-js";
import type { Observable } from "rxjs";
import { fromEventPattern, Subject } from "rxjs";
import { filter, share, switchMap, takeUntil } from "rxjs/operators";

import type { RxSlpStream } from "../stream";

interface ConversionEventPayload {
  combo: ConversionType;
  settings: GameStartType;
}

export class RealTimeConversionEvents {
  private stream$: Observable<RxSlpStream>;
  private destroy$ = new Subject<void>();
  private conversionComputer = new ConversionComputer();
  public end$ = fromEventPattern<ConversionEventPayload>(
    (handler) => this.conversionComputer.on("CONVERSION", handler),
    (handler) => this.conversionComputer.off("CONVERSION", handler),
  ).pipe(share());

  public constructor(stream: Observable<RxSlpStream>) {
    this.stream$ = stream;

    this.stream$
      .pipe(
        switchMap((s) => s.gameStart$),
        takeUntil(this.destroy$),
      )
      .subscribe((settings) => {
        this.conversionComputer.setup(settings);
      });

    this.stream$
      .pipe(
        switchMap((s) => s.allFrames$),
        takeUntil(this.destroy$),
        filter(({ latestFrame }) => {
          const players = Object.keys(latestFrame.players);
          return players.length === 2;
        }),
      )
      .subscribe(({ latestFrame, allFrames }) => {
        this.conversionComputer.processFrame(latestFrame, allFrames);
      });
  }

  public destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
