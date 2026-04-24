import { ComboComputer } from "@slippi/slippi-js";
import type { Observable } from "rxjs";
import { fromEventPattern } from "rxjs";
import { filter, share, switchMap } from "rxjs/operators";

import type { RxSlpStream } from "../stream";
import type { ComboEventPayload } from "../types";
import { RealTimeConversionEvents } from "./conversion";

export class RealTimeComboEvents {
  private stream$: Observable<RxSlpStream>;

  private comboComputer = new ComboComputer();

  public start$ = fromEventPattern<ComboEventPayload>(
    (handler) => this.comboComputer.on("COMBO_START", handler),
    (handler) => this.comboComputer.off("COMBO_START", handler),
  ).pipe(share());
  public extend$ = fromEventPattern<ComboEventPayload>(
    (handler) => this.comboComputer.on("COMBO_EXTEND", handler),
    (handler) => this.comboComputer.off("COMBO_EXTEND", handler),
  ).pipe(share());
  public end$ = fromEventPattern<ComboEventPayload>(
    (handler) => this.comboComputer.on("COMBO_END", handler),
    (handler) => this.comboComputer.off("COMBO_END", handler),
  ).pipe(share());
  public conversion$: Observable<ComboEventPayload>;

  public constructor(stream: Observable<RxSlpStream>) {
    this.stream$ = stream;

    const conversionEvents = new RealTimeConversionEvents(stream);
    this.conversion$ = conversionEvents.end$;

    // Reset the state on game start
    this.stream$.pipe(switchMap((s) => s.gameStart$)).subscribe((settings) => {
      this.comboComputer.setup(settings);
    });

    // Handle the frame processing
    this.stream$
      .pipe(
        switchMap((s) => s.allFrames$),
        // We only want the frames for two player games
        filter(({ latestFrame }) => {
          const players = Object.keys(latestFrame.players);
          return players.length === 2;
        }),
      )
      .subscribe(({ allFrames, latestFrame }) => {
        this.comboComputer.processFrame(latestFrame, allFrames);
      });
  }
}
