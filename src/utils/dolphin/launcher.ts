import fs from "fs-extra";

import { ChildProcess, execFile } from "child_process";
import { Subject, Observable, zip, from, merge } from "rxjs";
import { filter, mapTo, takeUntil } from "rxjs/operators";

import { DolphinQueueFormat } from "./queue";
import { DolphinOutput, DolphinPlaybackStatus } from "./output";


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
  batch: false,
  startBuffer: 1,   // Sometimes Dolphin misses the start frame so start from the following frame
  endBuffer: 1,     // Match the start frame because why not
}


export class DolphinLauncher {
  public dolphin: ChildProcess | null = null;
  protected options: DolphinLauncherOptions;

  public output: DolphinOutput;
  private dolphinPath: string;

  private playbackFilenameSource = new Subject<string>();
  public playbackFilename$ = this.playbackFilenameSource.asObservable();

  private dolphinQuitSource = new Subject<void>();
  public dolphinQuit$ = this.dolphinQuitSource.asObservable();

  public playbackEnd$: Observable<void>;

  public constructor(dolphinPath: string, options?: Partial<DolphinLauncherOptions>) {
    this.dolphinPath = dolphinPath;
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

  public async loadJSON(comboFilePath: string): Promise<void> {
    // Kill process if already running
    if (this.dolphin) {
      this.dolphin.kill();
      this.dolphin = null;
    }

    const dolphinQueue: DolphinQueueFormat = await fs.readJSON(comboFilePath);

    this.dolphin = this._executeFile(comboFilePath);
    this.dolphin.on("close", () => this.dolphinQuitSource.next());

    if (this.dolphin.stdout) {
      const fileNames$ = from(dolphinQueue.queue.map(f => f.path));
      // We have to handle the filenames here because if we pipe all the filenames
      // immediately and then zip them up later, we may end up with the filenames
      // out of sync.
      zip(
        fileNames$,
        this.output.playbackStatus$.pipe(filter(payload => payload.status === DolphinPlaybackStatus.FILE_LOADED)),
        (val, _) => val,
      ).pipe(
        takeUntil(this.playbackEnd$),
      ).subscribe((filename) => {
        // We want to manually call the next function otherwise the subject will
        // complete when playback ends, stopping all further events.
        this.playbackFilenameSource.next(filename);
      });

      // Pipe to the dolphin output but don't end
      this.dolphin.stdout.pipe(this.output, { end: false });
    }
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

}
