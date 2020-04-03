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

import { ReplaySubject, Subject, merge } from "rxjs";

import { ChildProcess, execFile } from "child_process";
import { observableDolphinProcess } from "./playback";
import { takeUntil } from "rxjs/operators";

// Node child processes crash if too much data has been sent to stdout.
// We set the max buffer to a really large number to avoid crashing Dolphin.
const MAX_BUFFER = 2 ** 20;

// Configurable options
interface DolphinLauncherOptions {
  meleeIsoPath: string;
  batch: boolean;
  startBuffer: number;
  endBuffer: number;
}

const defaultDolphinLauncherOptions = {
  meleeIsoPath: "",
  batch: true,
  startBuffer: 1,   // Sometimes Dolphin misses the start frame so start from the following frame
  endBuffer: 1,     // Match the start frame because why not
}

export interface GamePlaybackEndPayload {
  gameEnded: boolean;
}

export class DolphinLauncher {
  private dolphinPath: string;
  private options: DolphinLauncherOptions;
  private dolphin: ChildProcess | null = null;
  private gameEnded = false;
  private currentFrame = -124;
  private lastGameFrame = -124;
  private startPlaybackFrame = -124;
  private endPlaybackFrame = -124;

  private playbackStartSource = new Subject<void>();
  private playbackEndSource = new ReplaySubject<GamePlaybackEndPayload>();
  private queueEmptySource = new Subject<void>();
  private dolphinExitSource = new Subject<void>();

  public playbackStart$ = this.playbackStartSource.asObservable();
  public playbackEnd$ = this.playbackEndSource.asObservable();
  public queueEmpty$ = this.queueEmptySource.asObservable();
  public dolphinExit$ = this.dolphinExitSource.asObservable();

  public constructor(dolphinPath: string, options?: Partial<DolphinLauncherOptions>) {
    this.dolphinPath = dolphinPath;
    this.options = Object.assign({}, defaultDolphinLauncherOptions, options);
  }

  public loadJSON(comboFilePath: string): ChildProcess {
    // Kill process if already running
    if (this.dolphin) {
      this.dolphin.kill();
      this.dolphin = null;
    }
    this._resetState();

    this.dolphin = this._executeFile(comboFilePath);

    this.dolphin.on("close", () => {
      this.dolphinExitSource.next();
    });

    if (this.dolphin.stdout) {
      const dolphin$ = observableDolphinProcess(this.dolphin.stdout);
      dolphin$.pipe(
        // Stop emitting on process close
        takeUntil(merge(
          this.dolphinExit$,
          this.queueEmpty$,
        )),
      ).subscribe(payload => {
        // console.log(`got command: ${payload.command} with value: ${payload.value}`);
        const value = parseInt(payload.value);
        switch (payload.command) {
        case "[CURRENT_FRAME]":
          this._handleCurrentFrame(value);
          break;
        case "[PLAYBACK_START_FRAME]":
          this._handlePlaybackStartFrame(value);
          break;
        case "[PLAYBACK_END_FRAME]":
          this._handlePlaybackEndFrame(value);
          break;
        case "[GAME_END_FRAME]":
          this._handleplaybackEndFrame(value);
          break;
        case "[NO_GAME]":
          this._handleNoGame();
          break;
        default:
          console.error(`Unknown command ${payload.command} with value ${payload.value}`);
          break;
        }
      });
    }
    return this.dolphin;
  }

  private _executeFile(comboFilePath: string): ChildProcess {
    const params = ["-i", comboFilePath];
    if (this.options.meleeIsoPath) {
      params.push("-e", this.options.meleeIsoPath)
    }
    if (this.options.batch) {
      params.push("-b")
    }
    return execFile(this.dolphinPath, params, { maxBuffer: MAX_BUFFER });
  }

  private _handleCurrentFrame(commandValue: number) {
    this.currentFrame = commandValue;
    if (this.currentFrame === this.startPlaybackFrame) {
      this.playbackStartSource.next();
    } else if (this.currentFrame === this.endPlaybackFrame) {
      this.playbackEndSource.next({
        gameEnded: this.gameEnded,
      });
      this._resetState();
    }
  }

  private _handlePlaybackStartFrame(commandValue: number) {
    // Ensure the start frame is at least bigger than the intital playback start frame
    this.startPlaybackFrame = Math.max(commandValue, commandValue + this.options.startBuffer);
  }

  private _handlePlaybackEndFrame(commandValue: number) {
    this.endPlaybackFrame = commandValue;
    // Play the game until the end
    this.gameEnded = this.endPlaybackFrame >= this.lastGameFrame;
    // Ensure the adjusted frame is between the start and end frames
    const adjustedEndFrame = Math.max(this.startPlaybackFrame, this.endPlaybackFrame - this.options.endBuffer);
    this.endPlaybackFrame = Math.min(adjustedEndFrame, this.lastGameFrame);
  }

  private _handleplaybackEndFrame(commandValue: number) {
    this.lastGameFrame = commandValue;
  }

  private _handleNoGame() {
    this.queueEmptySource.next();
  }

  private _resetState() {
    this.currentFrame = -124;
    this.lastGameFrame = -124;
    this.startPlaybackFrame = -124;
    this.endPlaybackFrame = -124;
    this.gameEnded = false;
  }
}