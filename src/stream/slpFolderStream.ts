import type { SlpFileWriterOptions } from "@slippi/slippi-js";
import { SlpStreamMode } from "@slippi/slippi-js";
import type { FSWatcher } from "chokidar";
import chokidar from "chokidar";
import path from "path";
import { BehaviorSubject, Subject } from "rxjs";
import type { WritableOptions } from "stream";
import type { TailStream } from "tailstream";
import tailstream from "tailstream";

import { RxSlpStream } from "./rxSlpStream";

/**
 * SlpFolderStream is responsible for monitoring a folder, and detecting
 * when a new SLP file is created and is written to. This creates
 * essentially a fake live-stream by reading the SLP file as it's
 * still being written to.
 *
 * Typically when you detect changes to a file that is still being written
 * to, you want to include a timeout where if the file isn't changed within
 * that timeout, you consider it "done" and stop checking it. However, since
 * players can pause Slippi games for an indefinite amount of time, we don't
 * want to timeout since the file might still continue to be written to. So to achieve
 * this, we use the package `tailstream` where we have to manually call `done()`
 * when we no longer anticipate the file to change.
 *
 * @extends {RxSlpStream}
 */
export class SlpFolderStream extends RxSlpStream {
  private stopRequested$ = new Subject<void>();
  private newFile$ = new BehaviorSubject<string | null>(null);
  private readStream: TailStream | null = null;
  private fileWatcher: FSWatcher | null = null;

  public constructor(options?: Partial<SlpFileWriterOptions>, opts?: WritableOptions) {
    super({ ...options, mode: SlpStreamMode.MANUAL }, opts);
    this._setupSubjects();
  }

  private _setupSubjects(): void {
    // Handle what happens when we detect a new file
    this.newFile$.subscribe((filePath) => {
      // Filepath can be null if it's not subscription hasn't started
      if (!filePath) {
        return;
      }

      this.endReadStream();

      // Restart the parser before we begin
      super.restart();

      this.readStream = tailstream.createReadStream(filePath);
      this.readStream.pipe(this, { end: false });
    });
  }

  private endReadStream(): void {
    if (this.readStream) {
      this.readStream.unpipe(this);
      this.readStream.done();
      this.readStream = null;
    }
  }

  private stopFileWatcher(): void {
    if (this.fileWatcher) {
      this.fileWatcher.close();
      this.fileWatcher = null;
    }
  }

  /**
   * Starts watching a particular folder for slp files. It treats all new
   * `.slp` files as though it's a live Slippi stream.
   *
   * @param {string} slpFolder
   * @memberof SlpFolderStream
   */
  public async start(slpFolder: string, options?: { includeSubfolders?: boolean }): Promise<void> {
    // Clean up any existing streams
    this.stopFileWatcher();
    this.endReadStream();

    // Initialize watcher.
    const subFolderGlob = options?.includeSubfolders ? "**" : "";
    const slpGlob = path.join(slpFolder, subFolderGlob, "*.slp");

    const watcher = chokidar.watch(slpGlob, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
      ignorePermissionErrors: true,
    });

    // Wait until the watcher is actually ready
    await new Promise((resolve) => watcher.once("ready", resolve));

    // Set up the new file listener
    watcher.on("add", (filename) => {
      this.newFile$.next(filename);
    });

    this.fileWatcher = watcher;
  }

  public stop(): void {
    this.stopFileWatcher();
    this.endReadStream();
    this.stopRequested$.next();
  }

  /**
   * Returns the latest created file that was found by folder monitoring.
   */
  public latestFile(): string | null {
    return this.newFile$.value;
  }
}
