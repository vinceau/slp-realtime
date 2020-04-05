/**
 * We can tap into the Dolphin state by reading the log printed to stdout.
 *
 * Dolphin will emit the following messages in following order:
 * [PLAYBACK_START_FRAME]: the frame playback will commence (defaults to -123 if omitted)
 * [GAME_END_FRAME]: the last frame of the game
 * [PLAYBACK_END_FRAME] this frame playback will end at (defaults to MAX_INT if omitted)
 * [CURRENT_FRAME] the current frame being played back
 * [NO_GAME] no more files in the queue
 */

import os from "os";
import { Writable, WritableOptions } from "stream";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

enum PlaybackCommand {
  PLAYBACK_START_FRAME = "[PLAYBACK_START_FRAME]",
  GAME_END_FRAME = "[GAME_END_FRAME]",
  PLAYBACK_END_FRAME = "[PLAYBACK_END_FRAME]",
  CURRENT_FRAME = "[CURRENT_FRAME]",
  NO_GAME = "[NO_GAME]",
}

export enum DolphinPlaybackStatus {
  FILE_LOADED = "FILE_LOADED",
  PLAYBACK_START = "PLAYBACK_START",
  PLAYBACK_END = "PLAYBACK_END",
  QUEUE_EMPTY = "QUEUE_EMPTY",
}

export interface DolphinPlaybackPayload {
  status: DolphinPlaybackStatus;
  data?: any;
}

export interface DolphinPlaybackInfo {
  command: string;
  value?: string;
}

interface BufferOptions {
  startBuffer: number;
  endBuffer: number;
}

const defaultBufferOptions = {
  startBuffer: 1,
  endBuffer: 1,
}

export class DolphinOutput extends Writable {
  private gameEnded = false;
  private currentFrame = -124;
  private lastGameFrame = -124;
  private startPlaybackFrame = -124;
  private endPlaybackFrame = -124;
  private buffers: BufferOptions;

  private streamEndedSource = new Subject<void>();
  private playbackStatusSource = new Subject<DolphinPlaybackPayload>();

  public playbackStatus$ = this.playbackStatusSource.asObservable().pipe(
    takeUntil(this.streamEndedSource),
  );

  public constructor(bufferOptions?: Partial<BufferOptions>, opts?: WritableOptions) {
    super(opts);
    this.buffers = Object.assign({}, defaultBufferOptions, bufferOptions);
    // Complete all the observables
    this.on("finish", () => {
      this.streamEndedSource.next();
    })
  }

  public setBuffer(bufferOptions: Partial<BufferOptions>): void {
    this.buffers = Object.assign(this.buffers, bufferOptions);
  }

  public _write(newData: Buffer, encoding: string, callback: (error?: Error | null, data?: any) => void): void {
    if (encoding !== "buffer") {
      throw new Error(`Unsupported stream encoding. Expected 'buffer' got '${encoding}'.`);
    }

    // Process data here
    const dataString = newData.toString();
    const lines = dataString.split(os.EOL).filter(line => Boolean(line))
    lines.forEach(line => {
      const [command, value] = line.split(" ");
      this._processCommand(command, value);
    });

    callback();
  }

  private _processCommand(command: string, val?: string): void {
    const value = parseInt(val);
    switch (command) {
    case PlaybackCommand.CURRENT_FRAME:
      this._handleCurrentFrame(value);
      break;
    case PlaybackCommand.PLAYBACK_START_FRAME:
      // We just started playing back a new file so we should reset the state
      this._resetState();
      this.playbackStatusSource.next({
        status: DolphinPlaybackStatus.FILE_LOADED,
      });
      this._handlePlaybackStartFrame(value);
      break;
    case PlaybackCommand.PLAYBACK_END_FRAME:
      this._handlePlaybackEndFrame(value);
      break;
    case PlaybackCommand.GAME_END_FRAME:
      this._handleplaybackEndFrame(value);
      break;
    case PlaybackCommand.NO_GAME:
      this._handleNoGame();
      break;
    default:
      console.error(`Unknown command ${command} with value ${val}`);
      break;
    }
  }

  private _handleCurrentFrame(commandValue: number): void {
    this.currentFrame = commandValue;
    if (this.currentFrame === this.startPlaybackFrame) {
      this.playbackStatusSource.next({
        status: DolphinPlaybackStatus.PLAYBACK_START,
      });
    } else if (this.currentFrame === this.endPlaybackFrame) {
      this.playbackStatusSource.next({
        status: DolphinPlaybackStatus.PLAYBACK_END,
        data: { gameEnded: this.gameEnded },
      });
      this._resetState();
    }
  }

  private _handlePlaybackStartFrame(commandValue: number): void {
    // Ensure the start frame is at least bigger than the intital playback start frame
    this.startPlaybackFrame = Math.max(commandValue, commandValue + this.buffers.startBuffer);
  }

  private _handlePlaybackEndFrame(commandValue: number): void {
    this.endPlaybackFrame = commandValue;
    // Play the game until the end
    this.gameEnded = this.endPlaybackFrame >= this.lastGameFrame;
    // Ensure the adjusted frame is between the start and end frames
    const adjustedEndFrame = Math.max(this.startPlaybackFrame, this.endPlaybackFrame - this.buffers.endBuffer);
    this.endPlaybackFrame = Math.min(adjustedEndFrame, this.lastGameFrame);
  }

  private _handleplaybackEndFrame(commandValue: number): void {
    this.lastGameFrame = commandValue;
  }

  private _handleNoGame(): void {
    this.playbackStatusSource.next({
      status: DolphinPlaybackStatus.QUEUE_EMPTY,
    });
  }

  private _resetState(): void {
    this.currentFrame = -124;
    this.lastGameFrame = -124;
    this.startPlaybackFrame = -124;
    this.endPlaybackFrame = -124;
    this.gameEnded = false;
  }

};
