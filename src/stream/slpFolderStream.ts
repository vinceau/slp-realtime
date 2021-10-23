import path from "path";

import chokidar from "chokidar";
import type { TailStream } from "tailstream";
import tailstream from "tailstream";
import { RxSlpStream } from "./rxSlpStream";
import type { SlpFileWriterOptions } from "@slippi/slippi-js";
import { SlpStreamMode } from "@slippi/slippi-js";
import type { WritableOptions } from "stream";
import { Subject, fromEvent, BehaviorSubject } from "rxjs";
import { map, switchMap, share, takeUntil } from "rxjs/operators";

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
  private startRequested$ = new Subject<[string, boolean]>();
  private stopRequested$ = new Subject<void>();
  private newFile$ = new BehaviorSubject<string | null>(null);
  private readStream: TailStream | null = null;

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

      console.log(`found a new file: ${filePath}`);
      this.endReadStream();

      // Restart the parser before we begin
      super.restart();

      this.readStream = tailstream.createReadStream(filePath);
      this.readStream.pipe(this, { end: false });
    });

    // Set up the new file listener
    this.startRequested$
      .pipe(
        switchMap(([slpFolder, includeSubfolders]) => {
          // End any existing read streams
          this.endReadStream();

          // Initialize watcher.
          const subFolderGlob = includeSubfolders ? "**" : "";
          const slpGlob = path.join(slpFolder, subFolderGlob, "*.slp");
          const watcher = chokidar.watch(slpGlob, {
            ignored: /(^|[\/\\])\../, // ignore dotfiles
            persistent: true,
            ignoreInitial: true,
            ignorePermissionErrors: true,
          });
          return fromEvent<[string, any]>(watcher, "add").pipe(
            share(),
            map(([filename]) => path.resolve(filename)),
            takeUntil(this.stopRequested$),
          );
        }),
      )
      .subscribe(this.newFile$);
  }

  private endReadStream(): void {
    if (this.readStream) {
      this.readStream.unpipe(this);
      this.readStream.done();
      this.readStream = null;
    }
  }

  /**
   * Starts watching a particular folder for slp files. It treats all new
   * `.slp` files as though it's a live Slippi stream.
   *
   * @param {string} slpFolder
   * @memberof SlpFolderStream
   */
  public start(slpFolder: string, includeSubfolders?: boolean): void {
    console.log(`Start monitoring${includeSubfolders ? " with subfolders" : ""}: ${slpFolder}`);
    this.startRequested$.next([slpFolder, Boolean(includeSubfolders)]);
  }

  public stop(): void {
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
