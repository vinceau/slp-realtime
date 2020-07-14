import { WritableOptions } from "stream";

import {
  Command,
  SlpStream as BasicSlpStream,
  SlpStreamSettings,
  SlpStreamEvent,
  SlpCommandEventPayload,
  SlpParser,
  MessageSizes,
  SlpParserEvent,
  GameStartType,
  FrameEntryType,
  GameEndType,
} from "@slippi/sdk";
import { Subject, fromEvent } from "rxjs";
import { share } from "rxjs/operators";

export { SlpStreamMode, SlpStreamSettings, SlpStreamEvent } from "@slippi/sdk";

/**
 * SlpStream is a writable stream of Slippi data. It passes the data being written in
 * and emits an event based on what kind of Slippi messages were processed.
 *
 * @class SlpStream
 * @extends {Writable}
 */
export class SlpStream extends BasicSlpStream {
  private parser = new SlpParser();
  private messageSizeSource = new Subject<Map<Command, number>>();

  // Observables
  public messageSize$ = this.messageSizeSource.asObservable();
  public gameStart$ = fromEvent<GameStartType>(this.parser, SlpParserEvent.SETTINGS).pipe(share());
  public playerFrame$ = fromEvent<FrameEntryType>(this.parser, SlpParserEvent.FINALIZED_FRAME).pipe(share());
  public gameEnd$ = fromEvent<GameEndType>(this.parser, SlpParserEvent.END).pipe(share());

  /**
   *Creates an instance of SlpStream.
   * @param {Partial<SlpStreamSettings>} [slpOptions]
   * @param {WritableOptions} [opts]
   * @memberof SlpStream
   */
  public constructor(slpOptions?: Partial<SlpStreamSettings>, opts?: WritableOptions) {
    super(slpOptions, opts);
    this.on(SlpStreamEvent.COMMAND, (data: SlpCommandEventPayload) => {
      const { command, payload } = data;
      this.parser.handleCommand(command, payload);
      switch (command) {
        case Command.MESSAGE_SIZES:
          this.messageSizeSource.next(payload as MessageSizes);
          break;
      }
    });
  }

  public restart(): void {
    this.parser.reset();
    super.restart();
  }
}
