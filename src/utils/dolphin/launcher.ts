import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { BehaviorSubject } from "rxjs";

import { DolphinOutput } from "./output";

// Configurable options
const defaultDolphinLauncherOptions = {
  dolphinPath: "", // Path to Dolphin executable
  meleeIsoPath: "", // Path to Melee iso
  batch: false, // Quit Dolphin when playback queue ends
  disableSeekBar: false, // Disable the Dolphin seek bar
  readEvents: true, // Track the Dolphin playback events over stdout
  startBuffer: 1, // Sometimes Dolphin misses the start frame so start from the following frame
  endBuffer: 1, // Match the start frame because why not
};

export type DolphinLauncherOptions = typeof defaultDolphinLauncherOptions;

export class DolphinLauncher {
  public output: DolphinOutput;
  public dolphin: ChildProcessWithoutNullStreams | null = null;
  protected options: DolphinLauncherOptions;

  // Indicates whether dolphin is currently running or not
  private dolphinRunningSource = new BehaviorSubject<boolean>(false);
  public dolphinRunning$ = this.dolphinRunningSource.asObservable();

  public constructor(options?: Partial<DolphinLauncherOptions>) {
    this.options = Object.assign({}, defaultDolphinLauncherOptions, options);
    this.output = new DolphinOutput(this.options);
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

    this.dolphin = this._startDolphin(comboFilePath);
    this.dolphin.on("exit", (exitCode) => {
      if (exitCode !== 0) {
        console.warn(`Dolphin terminated with exit code: ${exitCode}`);
      }
      this.dolphinRunningSource.next(false);
    });
    // Pipe to the dolphin output but don't end
    this.dolphin.stdout.pipe(this.output, { end: false });
    this.dolphinRunningSource.next(true);
  }

  private _startDolphin(comboFilePath: string): ChildProcessWithoutNullStreams {
    if (!this.options.dolphinPath) {
      throw new Error("Dolphin path is not set!");
    }

    const params = ["-i", comboFilePath];
    if (this.options.meleeIsoPath) {
      params.push("-e", this.options.meleeIsoPath);
    }
    if (this.options.readEvents) {
      params.push("-c");
    }
    if (this.options.batch) {
      params.push("-b");
    }
    if (this.options.disableSeekBar) {
      params.push("-hs");
    }
    return spawn(this.options.dolphinPath, params);
  }
}
