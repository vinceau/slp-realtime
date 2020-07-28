import {
  Command,
  SlpStreamEvent,
  SlpCommandEventPayload,
  SlpParser,
  MessageSizes,
  SlpParserEvent,
  GameStartType,
  FrameEntryType,
  GameEndType,
  SlpFileWriter,
  SlpFileWriterOptions,
  SlpStreamSettings,
} from "@slippi/slippi-js";
import { Subject, fromEvent } from "rxjs";
import { share } from "rxjs/operators";
import { WritableOptions } from "stream";

export { SlpStreamMode, SlpStreamSettings, SlpStreamEvent } from "@slippi/slippi-js";

/**
 * SlpStream is a writable stream of Slippi data. It passes the data being written in
 * and emits an event based on what kind of Slippi messages were processed.
 *
 * @class SlpStream
 * @extends {Writable}
 */
export class RxSlpStream extends SlpFileWriter {
  protected parser = new SlpParser();
  private messageSizeSource = new Subject<Map<Command, number>>();

  // Observables
  public messageSize$ = this.messageSizeSource.asObservable();
  public gameStart$ = fromEvent<GameStartType>(this.parser, SlpParserEvent.SETTINGS).pipe(
    // tap(() => console.log("got a new game")),
    share(),
  );
  public playerFrame$ = fromEvent<FrameEntryType>(this.parser, SlpParserEvent.FINALIZED_FRAME).pipe(
    // tap((f) => {
    // console.log(`got frame: ${f.frame}`);
    // }),
    share(),
  );
  public gameEnd$ = fromEvent<GameEndType>(this.parser, SlpParserEvent.END).pipe(
    // tap(() => console.log("game ended")),
    share(),
  );

  /**
   *Creates an instance of SlpStream.
   * @param {Partial<SlpStreamSettings>} [slpOptions]
   * @param {WritableOptions} [opts]
   * @memberof SlpStream
   */
  public constructor(
    options?: Partial<SlpFileWriterOptions>,
    slpOptions?: Partial<SlpStreamSettings>,
    opts?: WritableOptions,
  ) {
    super(
      {
        ...options,
        outputFiles: options && options.outputFiles === true, // Don't write out files unless manually specified
      },
      slpOptions,
      opts,
    );

    this.on(SlpStreamEvent.COMMAND, (data: SlpCommandEventPayload) => {
      const { command, payload } = data;
      try {
        this.parser.handleCommand(command, payload);
        switch (command) {
          case Command.MESSAGE_SIZES:
            this.messageSizeSource.next(payload as MessageSizes);
            break;
        }
      } catch (err) {
        console.error(`Error processing command ${command}: ${err}`);
      }
    });
  }

  public restart(): void {
    this.parser.reset();
    super.restart();
  }
}
