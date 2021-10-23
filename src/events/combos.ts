import { ComboComputer } from "@slippi/slippi-js";
import type { Observable } from "rxjs";
import { fromEvent } from "rxjs";
import { filter, share, switchMap } from "rxjs/operators";

import type { RxSlpStream } from "../stream";
import type { ComboEventPayload } from "../types";
import { ConversionEvents } from "./conversion";

export class ComboEvents {
  private stream$: Observable<RxSlpStream>;

  private comboComputer = new ComboComputer();

  public start$ = fromEvent<ComboEventPayload>(this.comboComputer, "COMBO_START").pipe(share());
  public extend$ = fromEvent<ComboEventPayload>(this.comboComputer, "COMBO_EXTEND").pipe(share());
  public end$ = fromEvent<ComboEventPayload>(this.comboComputer, "COMBO_END").pipe(share());
  public conversion$: Observable<ComboEventPayload>;

  public constructor(stream: Observable<RxSlpStream>) {
    this.stream$ = stream;

    const conversionEvents = new ConversionEvents(stream);
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
