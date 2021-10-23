import type {
  SlpCommandEventPayload,
  MessageSizes,
  GameStartType,
  FrameEntryType,
  GameEndType,
  SlpFileWriterOptions,
  FramesType,
} from "@slippi/slippi-js";
import { Command, SlpStreamEvent, SlpParser, SlpParserEvent, SlpFileWriter } from "@slippi/slippi-js";
import { Subject, fromEvent } from "rxjs";
import { map, share, tap } from "rxjs/operators";
import type { WritableOptions } from "stream";

export { SlpStreamMode, SlpStreamSettings, SlpStreamEvent } from "@slippi/slippi-js";

/**
 * SlpStream is a writable stream of Slippi data. It passes the data being written in
 * and emits an event based on what kind of Slippi messages were processed.
 *
 * @class SlpStream
 * @extends {Writable}
 */
export class RxSlpStream extends SlpFileWriter {
  protected parser = new SlpParser({ strict: true }); // Strict mode will enable data validation
  private messageSizeSource = new Subject<Map<Command, number>>();
  private allFrames: FramesType = {};

  // Observables
  public messageSize$ = this.messageSizeSource.asObservable();
  public gameStart$ = fromEvent<GameStartType>(this.parser, SlpParserEvent.SETTINGS).pipe(share());
  public playerFrame$ = fromEvent<FrameEntryType>(this.parser, SlpParserEvent.FINALIZED_FRAME).pipe(share());
  public gameEnd$ = fromEvent<GameEndType>(this.parser, SlpParserEvent.END).pipe(share());
  public allFrames$ = this.playerFrame$.pipe(
    // Run this side effect first so we can update allFrames
    tap((latestFrame) => {
      const frameNum = latestFrame.frame;
      if (frameNum !== null || frameNum !== undefined) {
        this.allFrames[frameNum] = latestFrame;
      }
    }),
    map((latestFrame) => {
      return {
        allFrames: this.allFrames,
        latestFrame,
      };
    }),
  );

  /**
   *Creates an instance of SlpStream.
   * @param {Partial<SlpStreamSettings>} [slpOptions]
   * @param {WritableOptions} [opts]
   * @memberof SlpStream
   */
  public constructor(options?: Partial<SlpFileWriterOptions>, opts?: WritableOptions) {
    super(
      {
        ...options,
        outputFiles: options && options.outputFiles === true, // Don't write out files unless manually specified
      },
      opts,
    );

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
