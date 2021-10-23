import type { ConversionType, GameStartType } from "@slippi/slippi-js";
import { ConversionComputer } from "@slippi/slippi-js";
import type { Observable } from "rxjs";
import { fromEvent } from "rxjs";
import type { RxSlpStream } from "../stream";
import { filter, share, switchMap } from "rxjs/operators";

interface ConversionEventPayload {
  combo: ConversionType;
  settings: GameStartType;
}

export class ConversionEvents {
  private stream$: Observable<RxSlpStream>;
  private conversionComputer = new ConversionComputer();
  public end$ = fromEvent<ConversionEventPayload>(this.conversionComputer, "CONVERSION").pipe(share());

  public constructor(stream: Observable<RxSlpStream>) {
    this.stream$ = stream;

    // Reset the state on game start
    this.stream$.pipe(switchMap((s) => s.gameStart$)).subscribe((settings) => {
      this.conversionComputer.setup(settings);
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
      .subscribe(({ latestFrame, allFrames }) => {
        this.conversionComputer.processFrame(latestFrame, allFrames);
      });
  }
}
