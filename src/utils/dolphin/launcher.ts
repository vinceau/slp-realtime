import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { Subject, Observable, merge } from "rxjs";
import { filter, mapTo } from "rxjs/operators";

import { DolphinOutput, DolphinPlaybackStatus } from "./output";

// Configurable options
const defaultDolphinLauncherOptions = {
  dolphinPath: "",          // Path to Dolphin executable
  meleeIsoPath: "",         // Path to Melee iso
  batch: false,             // Quit Dolphin when playback queue ends
  disableSeekBar: false,    // Disable the Dolphin seek bar
  startBuffer: 1,           // Sometimes Dolphin misses the start frame so start from the following frame
  endBuffer: 1,             // Match the start frame because why not
}

type DolphinLauncherOptions = typeof defaultDolphinLauncherOptions;

export class DolphinLauncher {
  public dolphin: ChildProcessWithoutNullStreams | null = null;
  protected options: DolphinLauncherOptions;

  public output: DolphinOutput;

  private dolphinQuitSource = new Subject<void>();
  public dolphinQuit$ = this.dolphinQuitSource.asObservable();

  public playbackEnd$: Observable<void>;

  public constructor(options?: Partial<DolphinLauncherOptions>) {
    this.options = Object.assign({}, defaultDolphinLauncherOptions, options);
    this.output = new DolphinOutput(this.options);
    this.playbackEnd$ = merge(
      this.output.playbackStatus$.pipe(filter(payload => payload.status === DolphinPlaybackStatus.QUEUE_EMPTY)),
      this.dolphinQuit$,
    ).pipe(
      mapTo(undefined),
    );
  }

  public updateSettings(options: Partial<DolphinLauncherOptions>): void {
    this.options = Object.assign(this.options, options);
    this.output.setBuffer(this.options);
  }

  public loadJSON(comboFilePath: string): void {
    // Kill process if already running
    if (this.dolphin) {
      this.dolphin.kill();
      this.dolphin = null;
    }

    this.dolphin = this._executeFile(comboFilePath);
    this.dolphin.on("exit", () => this.dolphinQuitSource.next());
    // Pipe to the dolphin output but don't end
    this.dolphin.stdout.pipe(this.output, { end: false });
  }

  private _executeFile(comboFilePath: string): ChildProcessWithoutNullStreams {
    if (!this.options.dolphinPath) {
      throw new Error("Dolphin path is not set!");
    }

    const params = ["-i", comboFilePath];
    if (this.options.meleeIsoPath) {
      params.push("-e", this.options.meleeIsoPath)
    }
    if (this.options.batch) {
      params.push("-b")
    }
    if (this.options.disableSeekBar) {
      params.push("-hs")
    }
    return spawn(this.options.dolphinPath, params);
  }

}
