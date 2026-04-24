import type { ConversionType, GameStartType } from "@slippi/slippi-js";
import { ComboComputer, ConversionComputer } from "@slippi/slippi-js";
import type { Observable } from "rxjs";
import { fromEventPattern, Subject } from "rxjs";
import { filter, shareReplay, switchMap, takeUntil } from "rxjs/operators";

import type { RxSlpStream } from "../stream";
import type { ComboEventPayload } from "../types";

type ConversionEventPayload = {
  combo: ConversionType;
  settings: GameStartType;
};

export class RealTimeComboEvents {
  private stream$: Observable<RxSlpStream>;
  private destroy$ = new Subject<void>();

  private comboComputer = new ComboComputer();
  private conversionComputer = new ConversionComputer();

  public start$ = fromEventPattern<ComboEventPayload>(
    (handler) => this.comboComputer.on("COMBO_START", handler),
    (handler) => this.comboComputer.off("COMBO_START", handler),
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  public extend$ = fromEventPattern<ComboEventPayload>(
    (handler) => this.comboComputer.on("COMBO_EXTEND", handler),
    (handler) => this.comboComputer.off("COMBO_EXTEND", handler),
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  public end$ = fromEventPattern<ComboEventPayload>(
    (handler) => this.comboComputer.on("COMBO_END", handler),
    (handler) => this.comboComputer.off("COMBO_END", handler),
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  public conversion$ = fromEventPattern<ConversionEventPayload>(
    (handler) => this.conversionComputer.on("CONVERSION", handler),
    (handler) => this.conversionComputer.off("CONVERSION", handler),
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  public constructor(stream: Observable<RxSlpStream>) {
    this.stream$ = stream;

    this.stream$
      .pipe(
        switchMap((s) => s.gameStart$),
        takeUntil(this.destroy$),
      )
      .subscribe((settings) => {
        this.comboComputer.setup(settings);
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
      .subscribe(({ allFrames, latestFrame }) => {
        this.comboComputer.processFrame(latestFrame, allFrames);
        this.conversionComputer.processFrame(latestFrame, allFrames);
      });
  }

  public destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
