import { Writable, WritableOptions } from "stream";

import { Command, parseMessage, GameStartType, PreFrameUpdateType, PostFrameUpdateType, GameEndType, FrameEntryType } from "slp-parser-js";
import { Subject } from "rxjs";

/*
export enum SlpEvent {
  MESSAGE_SIZES = "messageSizes",
  RAW_COMMAND = "command",
  GAME_START = "gameStart",
  PRE_FRAME_UPDATE = "preFrameUpdate",
  POST_FRAME_UPDATE = "postFrameUpdate",
  GAME_END = "gameEnd",
}
*/

const NETWORK_MESSAGE = "HELO\0";

const defaultSettings = {
  singleGameMode: false,
  logErrors: false,
};

export type SlpStreamSettings = typeof defaultSettings;

/**
 * SlpStream is a writable stream of Slippi data. It passes the data being written in
 * and emits an event based on what kind of Slippi messages were processed.
 *
 * @class SlpStream
 * @extends {Writable}
 */
export class RxSlpStream extends Writable {
  private settings: SlpStreamSettings;
  private gameReady = false;
  private payloadSizes = new Map<Command, number>();
  private previousBuffer: Uint8Array = Buffer.from([]);
  private playerFrame: FrameEntryType | null = null;
  private followerFrame: FrameEntryType | null = null;

  public messageSize$ = new Subject<Map<Command, number>>();
  public rawCommand$ = new Subject<{
    command: Command;
    payload: Buffer;
  }>();
  public gameStart$ = new Subject<GameStartType>();
  public preFrameUpdate$ = new Subject<PreFrameUpdateType>();
  public postFrameUpdate$ = new Subject<PostFrameUpdateType>();
  public playerFrame$ = new Subject<FrameEntryType>()
  public followerFrame$ = new Subject<FrameEntryType>()
  public gameEnd$ = new Subject<GameEndType>();

  /**
   *Creates an instance of SlpStream.
   * @param {Partial<SlpStreamSettings>} [slpOptions]
   * @param {WritableOptions} [opts]
   * @memberof SlpStream
   */
  public constructor(slpOptions?: Partial<SlpStreamSettings>, opts?: WritableOptions) {
    super(opts);
    this.settings = Object.assign({}, defaultSettings, slpOptions);
  }

  public _write(newData: Buffer, encoding: string, callback: (error?: Error | null, data?: any) => void): void {
    if (encoding !== "buffer") {
      throw new Error(`Unsupported stream encoding. Expected 'buffer' got '${encoding}'.`);
    }

    // Join the current data with the old data
    const data = Uint8Array.from(Buffer.concat([
      this.previousBuffer,
      newData,
    ]));

    // Clear previous data
    this.previousBuffer = Buffer.from([]);

    const dataView = new DataView(data.buffer);

    // Iterate through the data
    let index = 0;
    while (index < data.length) {
      // We want to filter out the network messages
      if (Buffer.from(data.slice(index, index + 5)).toString() === NETWORK_MESSAGE) {
        index += 5;
        continue;
      }

      // Make sure we have enough data to read a full payload
      const command = dataView.getUint8(index);
      const payloadSize = this.payloadSizes.get(command) || 0;
      const remainingLen = data.length - index;
      if (remainingLen < payloadSize + 1) {
        // If remaining length is not long enough for full payload, save the remaining
        // data until we receive more data. The data has been split up.
        this.previousBuffer = data.slice(index);
        break;
      }

      // Increment by one for the command byte
      index += 1;

      const payloadPtr = data.slice(index);
      const payloadDataView = new DataView(data.buffer, index);
      let payloadLen = 0;
      try {
        payloadLen = this._processCommand(command, payloadPtr, payloadDataView);
      } catch (err) {
        if (this.settings.logErrors) {
          console.error(err);
        }
        payloadLen = 0;
      }
      index += payloadLen;
    }

    callback();
  }

  private _writeCommand(command: Command, entirePayload: Uint8Array, payloadSize: number): Uint8Array {
    const payloadBuf = entirePayload.slice(0, payloadSize);
    const bufToWrite = Buffer.concat([
      Buffer.from([command]),
      payloadBuf,
    ]);
    // Forward the data onwards
    this.rawCommand$.next({
      command,
      payload: bufToWrite,
    });
    return new Uint8Array(bufToWrite);
  }

  private _processCommand(command: Command, entirePayload: Uint8Array, dataView: DataView): number {
    // Handle the message size command
    if (command === Command.MESSAGE_SIZES) {
      const payloadSize =  this._processReceiveCommands(dataView);
      // Emit the message size event
      this.messageSize$.next(this.payloadSizes);
      // Emit the raw command event
      this._writeCommand(command, entirePayload, payloadSize);
      // Mark this game as ready to process data
      this.gameReady = true;
      return payloadSize;
    }

    // If we're only processing a single game and the game is over then stop processing
    if (this.settings.singleGameMode && !this.gameReady) {
      return 0;
    }

    const payloadSize = this.payloadSizes.get(command);
    if (!payloadSize) {
      throw new Error(`Could not get payload sizes for command: ${command}`);
    }

    // Fetch the payload and parse it
    const payload = this._writeCommand(command, entirePayload, payloadSize);
    const parsedPayload = parseMessage(command, payload);
    if (!parsedPayload) {
      // Failed to parse
      throw new Error(`Failed to parse payload for command: ${command}`);
    }

    switch (command) {
    case Command.GAME_START:
      this.gameStart$.next(parsedPayload as GameStartType);
      break;
    case Command.GAME_END:
      this.gameReady = false;
      this.gameEnd$.next(parsedPayload as GameEndType);
      break;
    case Command.PRE_FRAME_UPDATE:
      this.preFrameUpdate$.next(parsedPayload as PreFrameUpdateType);
      this._handleFrameUpdate(command, parsedPayload as PreFrameUpdateType);
      break;
    case Command.POST_FRAME_UPDATE:
      this.postFrameUpdate$.next(parsedPayload as PostFrameUpdateType);
      this._handleFrameUpdate(command, parsedPayload as PostFrameUpdateType);
      break;
    default:
      break;
    }
    return payloadSize;
  }

  private _processReceiveCommands(dataView: DataView): number {
    const payloadLen = dataView.getUint8(0);
    for (let i = 1; i < payloadLen; i += 3) {
      const commandByte = dataView.getUint8(i);
      const payloadSize = dataView.getUint16(i + 1);
      this.payloadSizes.set(commandByte, payloadSize);
    }
    return payloadLen;
  }

  private _handleFrameUpdate(command: Command, payload: PreFrameUpdateType | PostFrameUpdateType): void {
    // we need to determine distinguish between player frames and follower frames
    // and reconstruct a full FrameEntryType
    const preOrPost = command === Command.PRE_FRAME_UPDATE ? "pre" : "post";
    const { frame, isFollower, playerIndex } = payload;
    let currentFrameData = isFollower ? this.followerFrame : this.playerFrame;

    if (currentFrameData !== null) {
      if (currentFrameData.frame === frame) {
        const playerInfo: any = currentFrameData.players[playerIndex];
        if (!playerInfo) {
          (currentFrameData as any).players[playerIndex] = {[preOrPost]: payload};
        } else {
          (currentFrameData as any).players[playerIndex][preOrPost] = payload;
        }
      } else if (command === Command.PRE_FRAME_UPDATE) {
        // This is probably the start of the next frame
        // Fire off an event for the last frame
        if (isFollower) {
          this.followerFrame$.next(currentFrameData);
        } else {
          this.playerFrame$.next(currentFrameData);
        }
        // Reset the current frame data
        currentFrameData = null;
      }
    }

    if (currentFrameData === null) {
      const newFrameData = {
        frame,
        players: {
          [playerIndex]: {
            [preOrPost]: payload
          }
        }
      };
      if (isFollower) {
        this.followerFrame = newFrameData as FrameEntryType;
      } else {
        this.playerFrame = newFrameData as FrameEntryType;
      }
    }
  }

}
