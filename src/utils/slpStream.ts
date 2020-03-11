import { Writable, WritableOptions } from "stream";

import { Command, parseMessage, GameStartType, PreFrameUpdateType, PostFrameUpdateType, GameEndType, FrameEntryType } from "slp-parser-js";
import { Subject } from "rxjs";
import { PlayerType } from "slp-parser-js/dist/utils/slpReader";
import { takeUntil } from "rxjs/operators";

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
export class SlpStream extends Writable {
  private settings: SlpStreamSettings;
  private payloadSizes: Map<Command, number> | null = null;
  private previousBuffer: Uint8Array = Buffer.from([]);
  private playerFrame: FrameEntryType | null = null;
  private followerFrame: FrameEntryType | null = null;
  private players = new Array<PlayerType>();

  // Sources
  private messageSizeSource = new Subject<Map<Command, number>>();
  private rawCommandSource = new Subject<{
    command: Command;
    payload: Buffer;
  }>();
  private gameStartSource = new Subject<GameStartType>();
  private preFrameUpdateSource = new Subject<PreFrameUpdateType>();
  private postFrameUpdateSource = new Subject<PostFrameUpdateType>();
  private playerFrameSource = new Subject<FrameEntryType>()
  private followerFrameSource = new Subject<FrameEntryType>()
  private gameEndSource = new Subject<GameEndType>();
  private streamEndedSource = new Subject<void>();

  // Observables
  public messageSize$ = this.messageSizeSource.asObservable().pipe(
    takeUntil(this.streamEndedSource),
  );
  public rawCommand$ = this.rawCommandSource.asObservable().pipe(
    takeUntil(this.streamEndedSource),
  );
  public gameStart$ = this.gameStartSource.asObservable().pipe(
    takeUntil(this.streamEndedSource),
  );
  public preFrameUpdate$ = this.preFrameUpdateSource.asObservable().pipe(
    takeUntil(this.streamEndedSource),
  );
  public postFrameUpdate$ = this.postFrameUpdateSource.asObservable().pipe(
    takeUntil(this.streamEndedSource),
  );
  public playerFrame$ = this.playerFrameSource.asObservable().pipe(
    takeUntil(this.streamEndedSource),
  );
  public followerFrame$ = this.followerFrameSource.asObservable().pipe(
    takeUntil(this.streamEndedSource),
  );
  public gameEnd$ = this.gameEndSource.asObservable().pipe(
    takeUntil(this.streamEndedSource),
  );

  /**
   *Creates an instance of SlpStream.
   * @param {Partial<SlpStreamSettings>} [slpOptions]
   * @param {WritableOptions} [opts]
   * @memberof SlpStream
   */
  public constructor(slpOptions?: Partial<SlpStreamSettings>, opts?: WritableOptions) {
    super(opts);
    this.settings = Object.assign({}, defaultSettings, slpOptions);
    // Complete all the observables
    this.on("finish", () => {
      this.streamEndedSource.next();
    })
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
      const payloadSize = this.payloadSizes ? this.payloadSizes.get(command) : 0;
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
    this.rawCommandSource.next({
      command,
      payload: bufToWrite,
    });
    return new Uint8Array(bufToWrite);
  }

  private _processCommand(command: Command, entirePayload: Uint8Array, dataView: DataView): number {
    // Handle the message size command
    if (command === Command.MESSAGE_SIZES && this.payloadSizes === null) {
      const payloadSize = dataView.getUint8(0);
      // Make sure the payload sizes are valid
      const payloadSizes = processReceiveCommands(dataView);
      if (!isValidMessageSizes(payloadSizes)) {
        return 0;
      }

      // Set the payload sizes
      this.payloadSizes = payloadSizes;
      // Emit the message size event
      this.messageSizeSource.next(this.payloadSizes);
      // Emit the raw command event
      this._writeCommand(command, entirePayload, payloadSize);
      return payloadSize;
    }

    const payloadSize = this.payloadSizes ? this.payloadSizes.get(command) : 0;

    // Fetch the payload and parse it
    let payload: Uint8Array;
    let parsedPayload: any;
    if (payloadSize > 0) {
      payload = this._writeCommand(command, entirePayload, payloadSize);
      parsedPayload = parseMessage(command, payload);
    }

    switch (command) {
      case Command.GAME_START:
        // Filter out the empty players
        let gameStart = parsedPayload as GameStartType;
        // Set the players for this current game
        this.players = gameStart.players.filter(p => p.type !== 3);
        gameStart = {
          ...gameStart,
          players: this.players,
        };
        this.gameStartSource.next(gameStart);
        break;
      case Command.GAME_END:
        this.gameEndSource.next(parsedPayload as GameEndType);

        // Reset players
        this.players = [];
        this.payloadSizes = null;

        // Emit stream end if single game mode is on
        if (this.settings.singleGameMode) {
          this.streamEndedSource.next();
        }
        break;
      case Command.PRE_FRAME_UPDATE:
        this.preFrameUpdateSource.next(parsedPayload as PreFrameUpdateType);
        this._handleFrameUpdate(command, parsedPayload as PreFrameUpdateType);
        break;
      case Command.POST_FRAME_UPDATE:
        this.postFrameUpdateSource.next(parsedPayload as PostFrameUpdateType);
        this._handleFrameUpdate(command, parsedPayload as PostFrameUpdateType);
        break;
      default:
        break;
    }
    return payloadSize;
  }

  private _handleFrameUpdate(command: Command, payload: PreFrameUpdateType | PostFrameUpdateType): void {
    // we need to determine distinguish between player frames and follower frames
    // and reconstruct a full FrameEntryType
    const preOrPost = command === Command.PRE_FRAME_UPDATE ? "pre" : "post";
    const { frame, isFollower, playerIndex } = payload;
    let currentFrameData: any = isFollower ? this.followerFrame : this.playerFrame;

    // Set up the initial frame information
    if (currentFrameData === null) {
      currentFrameData = {
        frame,
        players: {}
      };
      if (isFollower) {
        this.followerFrame = currentFrameData as FrameEntryType;
      } else {
        this.playerFrame = currentFrameData as FrameEntryType;
      }
    }

    // Sanity check, ensure that the frame is the same
    if (currentFrameData.frame === frame) {
      const playerInfo: any = currentFrameData.players[playerIndex];
      if (!playerInfo) {
        currentFrameData.players[playerIndex] = {[preOrPost]: payload};
      } else {
        currentFrameData.players[playerIndex][preOrPost] = payload;
      }
    }

    // If the frame is complete then send off the frame
    if (command === Command.POST_FRAME_UPDATE && this._isCompletedFrame(currentFrameData)) {
      // Fire off an event for the last frame and reset the frame
      if (isFollower) {
        this.followerFrameSource.next(currentFrameData);
        this.followerFrame = null;
      } else {
        this.playerFrameSource.next(currentFrameData);
        this.playerFrame = null;
      }
    }
  }

  private _isCompletedFrame(frame: FrameEntryType): boolean {
    const playerIndices = Object.keys(frame.players);
    // Make sure we have the correct number of players
    if (this.players.length === 0 || playerIndices.length !== this.players.length) {
      return false;
    }

    for (const playerIndex of playerIndices) {
      const frameData = frame.players[playerIndex as any];
      // Make sure we have both pre and post frame data
      if (!frameData.pre || !frameData.post) {
        return false;
      }
    }

    return true;
  }
}

const processReceiveCommands = (dataView: DataView): Map<Command, number> => {
  const payloadSizes = new Map<Command, number>();
  const payloadLen = dataView.getUint8(0);
  for (let i = 1; i < payloadLen; i += 3) {
    const commandByte = dataView.getUint8(i);
    const payloadSize = dataView.getUint16(i + 1);
    payloadSizes.set(commandByte, payloadSize);
  }
  return payloadSizes;
}

const isValidMessageSizes = (sizes: Map<Command, number>): boolean => {
  const allCommands = Array.from(sizes.keys());
  const expectedCommands = [Command.GAME_START, Command.GAME_END, Command.PRE_FRAME_UPDATE, Command.POST_FRAME_UPDATE];
  for (const expected of expectedCommands) {
    if (!allCommands.includes(expected)) {
      return false;
    }
  }
  return true;
};
