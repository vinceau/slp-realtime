import { SlpStream, SlpStreamSettings } from "./slpStream";
import { Subject } from "rxjs";
import { WritableOptions } from "stream";
import { pausable } from "../operators";
import { pipeFileContents } from "../utils";
import { share } from "rxjs/operators";

export class ManualSlpStream extends SlpStream {
  protected restartStream$ = new Subject<void>();
  protected stopStream$ = new Subject<void>();

  public constructor(slpOptions?: Partial<SlpStreamSettings>, opts?: WritableOptions) {
    super(slpOptions, opts);

    this.messageSize$ = this.messageSizeSource
      .asObservable()
      .pipe(pausable(this.stopStream$, this.restartStream$), share());
    this.rawCommand$ = this.rawCommandSource
      .asObservable()
      .pipe(pausable(this.stopStream$, this.restartStream$), share());
    this.gameStart$ = this.gameStartSource
      .asObservable()
      .pipe(pausable(this.stopStream$, this.restartStream$), share());
    this.preFrameUpdate$ = this.preFrameUpdateSource
      .asObservable()
      .pipe(pausable(this.stopStream$, this.restartStream$), share());
    this.postFrameUpdate$ = this.postFrameUpdateSource
      .asObservable()
      .pipe(pausable(this.stopStream$, this.restartStream$), share());
    this.playerFrame$ = this.playerFrameSource
      .asObservable()
      .pipe(pausable(this.stopStream$, this.restartStream$), share());
    this.followerFrame$ = this.followerFrameSource
      .asObservable()
      .pipe(pausable(this.stopStream$, this.restartStream$), share());
    this.gameEnd$ = this.gameEndSource.asObservable().pipe(pausable(this.stopStream$, this.restartStream$), share());

    // Stop the stream whenever we hit a game end event
    this.gameEnd$.subscribe(() => {
      this.stopStream$.next();
    });
  }

  public async pipeFile(filename: string): Promise<void> {
    this.restart();
    await pipeFileContents(filename, this, { end: false });
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
