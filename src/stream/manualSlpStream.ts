import { SlpStream, SlpStreamSettings } from "./slpStream";
import { Subject } from "rxjs";
import { WritableOptions } from "stream";
import { pausable } from "../operators";

export class ManualSlpStream extends SlpStream {
  protected restartStream$ = new Subject<void>();
  protected stopStream$ = new Subject<void>();

  public constructor(slpOptions?: Partial<SlpStreamSettings>, opts?: WritableOptions) {
    super(slpOptions, opts);
    // Stop the stream whenever we hit a game end event
    this.gameEndSource.subscribe(() => {
      this.stopStream$.next();
    });

    this.messageSize$ = this.messageSizeSource.asObservable().pipe(pausable(this.stopStream$, this.restartStream$));
    this.rawCommand$ = this.rawCommandSource.asObservable().pipe(pausable(this.stopStream$, this.restartStream$));
    this.gameStart$ = this.gameStartSource.asObservable().pipe(pausable(this.stopStream$, this.restartStream$));
    this.preFrameUpdate$ = this.preFrameUpdateSource
      .asObservable()
      .pipe(pausable(this.stopStream$, this.restartStream$));
    this.postFrameUpdate$ = this.postFrameUpdateSource
      .asObservable()
      .pipe(pausable(this.stopStream$, this.restartStream$));
    this.playerFrame$ = this.playerFrameSource.asObservable().pipe(pausable(this.stopStream$, this.restartStream$));
    this.followerFrame$ = this.followerFrameSource.asObservable().pipe(pausable(this.stopStream$, this.restartStream$));
    this.gameEnd$ = this.gameEndSource.asObservable().pipe(pausable(this.stopStream$, this.restartStream$));
  }

  public restart(): void {
    this.restartStream$.next();
  }

  public stop(): void {
    this.stopStream$.next();
  }

  public complete(): void {
    this.stopStream$.complete();
    this.restartStream$.complete();
  }
}
