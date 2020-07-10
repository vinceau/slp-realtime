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
} from "@slippi/sdk";
import { GameStartType, GameEndType, FrameEntryType } from "../types";
import { Subject } from "rxjs";

/**
 * SlpStream is a writable stream of Slippi data. It passes the data being written in
 * and emits an event based on what kind of Slippi messages were processed.
 *
 * @class SlpStream
 * @extends {Writable}
 */
export class SlpStream extends BasicSlpStream {
  protected parser = new SlpParser();
  // Sources
  protected messageSizeSource = new Subject<Map<Command, number>>();
  protected gameStartSource = new Subject<GameStartType>();
  protected playerFrameSource = new Subject<FrameEntryType>();
  protected gameEndSource = new Subject<GameEndType>();

  // Observables
  public messageSize$ = this.messageSizeSource.asObservable();
  public gameStart$ = this.gameStartSource.asObservable();
  public playerFrame$ = this.playerFrameSource.asObservable();
  public gameEnd$ = this.gameEndSource.asObservable();

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
    this.parser.on(SlpParserEvent.SETTINGS, (settings: GameStartType) => {
      this.gameStartSource.next(settings);
    });
    this.parser.on(SlpParserEvent.END, (gameEnd: GameEndType) => {
      this.gameEndSource.next(gameEnd);
    });
    this.parser.on(SlpParserEvent.FINALIZED_FRAME, (frameEntry: FrameEntryType) => {
      this.playerFrameSource.next(frameEntry);
    });
  }
}
