import type {
  FrameEntryType,
  FramesType,
  GameEndType,
  GameStartType,
  MessageSizes,
  SlpCommandEventPayload,
  SlpStreamSettings,
} from "@slippi/slippi-js";
import { Command, SlpParser, SlpParserEvent, SlpStream, SlpStreamEvent } from "@slippi/slippi-js";
import { fromEventPattern, Subject } from "rxjs";
import { map, shareReplay, tap } from "rxjs/operators";

/**
 * SlpStream is a writable stream of Slippi data. It passes the data being written in
 * and emits an event based on what kind of Slippi messages were processed.
 *
 * @class SlpStream
 * @extends {Writable}
 */
export class RxSlpStream extends SlpStream {
  protected parser = new SlpParser({ strict: true }); // Strict mode will enable data validation
  private messageSizeSource = new Subject<Map<Command, number>>();
  private allFrames: FramesType = {};

  // Observables
  public messageSize$ = this.messageSizeSource.asObservable();
  public gameStart$ = fromEventPattern<GameStartType>(
    (handler) => this.parser.on(SlpParserEvent.SETTINGS, handler),
    (handler) => this.parser.off(SlpParserEvent.SETTINGS, handler),
  ).pipe(shareReplay(1));
  public playerFrame$ = fromEventPattern<FrameEntryType>(
    (handler) => this.parser.on(SlpParserEvent.FINALIZED_FRAME, handler),
    (handler) => this.parser.off(SlpParserEvent.FINALIZED_FRAME, handler),
  ).pipe(shareReplay(1));
  public gameEnd$ = fromEventPattern<GameEndType>(
    (handler) => this.parser.on(SlpParserEvent.END, handler),
    (handler) => this.parser.off(SlpParserEvent.END, handler),
  ).pipe(shareReplay(1));
  public allFrames$ = this.playerFrame$.pipe(
    tap((latestFrame) => {
      const frameNum = latestFrame.frame;
      this.allFrames[frameNum] = latestFrame;
    }),
    map((latestFrame) => {
      return {
        allFrames: this.allFrames,
        latestFrame,
      };
    }),
    shareReplay(1),
  );

  /**
   *Creates an instance of SlpStream.
   * @param {Partial<SlpStreamSettings>} [slpOptions]
   * @param {WritableOptions} [opts]
   * @memberof SlpStream
   */
  public constructor(options?: SlpStreamSettings) {
    super(options);

    this.on(SlpStreamEvent.COMMAND, (data: SlpCommandEventPayload) => {
      const { command, payload } = data;
      switch (command) {
        case Command.MESSAGE_SIZES:
          this.parser.reset();
          this.messageSizeSource.next(payload as MessageSizes);
          break;
      }

      try {
        this.parser.handleCommand(command, payload);
      } catch (err) {
        console.error(`Error processing command ${command}: ${err}`);
      }
    });
  }

  public restart(): void {
    this.parser.reset();
    super.restart();
    this.allFrames = {};
  }
}
