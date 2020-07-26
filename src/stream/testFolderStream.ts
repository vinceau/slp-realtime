import path from "path";
import fs from "fs-extra";

import chokidar, { FSWatcher } from "chokidar";
import tailstream, { TailStream } from "tailstream";
import { RxSlpStream } from "./slpStream";
import { SlpParserEvent, SlpFileWriterOptions, SlpStreamSettings, SlpStreamMode } from "@slippi/slippi-js";
import { WritableOptions } from "stream";
import { Subject, from, Observable, fromEvent } from "rxjs";
import { concatMap, map, switchMap, filter, share, tap } from "rxjs/operators";

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
export class TestFolderStream extends RxSlpStream {
  private startRequested$ = new Subject<string>();
  private stopRequested$ = new Subject<void>();

  public constructor(
    options?: Partial<SlpFileWriterOptions>,
    slpOptions?: Partial<SlpStreamSettings>,
    opts?: WritableOptions,
  ) {
    super(options, { ...slpOptions, mode: SlpStreamMode.MANUAL }, opts);
    const onNewFile: Observable<string> = this.startRequested$.pipe(
      tap((f) => {
        console.log(`got a new start request to monitor folder: ${f}`);
      }),
      concatMap((slpFolder) =>
        from(fs.readdir(slpFolder)).pipe(
          // Map the files to be absolute paths
          map((initialFiles) => ({
            folderPath: slpFolder,
            initialFiles: initialFiles.map((f) => path.resolve(path.join(slpFolder, f))),
          })),
        ),
      ),
      switchMap((info) => {
        // Initialize watcher.
        const slpGlob = path.join(info.folderPath, "*.slp");
        const watcher = chokidar.watch(slpGlob, {
          ignored: /(^|[\/\\])\../, // ignore dotfiles
          persistent: true,
        });
        return fromEvent<[string, any]>(watcher, "add").pipe(
          share(),
          map(([filename]) => path.resolve(filename)),
          filter((filename) => !info.initialFiles.includes(filename)),
        );
      }),
    );
    const onFileData = onNewFile.pipe(
      switchMap((filePath) => {
        console.log(`found a new file: ${filePath}`);
        // Restart the parser before we begin
        super.restart();
        console.log("restarting tailstream");
        const readStream = tailstream.createReadStream(filePath);
        return fromEvent<any>(readStream, "data").pipe(share()); //, (data: any) => this.write(data));
      }),
    );
    onFileData.subscribe((data) => {
      console.log(">>>>>> START DATA FROM TAILSTREAM SUBSCRIPTION <<<<<<");
      console.log(data.toString("hex").match(/../g).join(" "));
      console.log(">>>>>> END DATA FROM TAILSTREAM SUBSCRIPTION <<<<<<");
      this.write(data);
    });
  }

  /**
   * Starts watching a particular folder for slp files. It treats all new
   * `.slp` files as though it's a live Slippi stream.
   *
   * @param {string} slpFolder
   * @memberof SlpFolderStream
   */
  public start(slpFolder: string): void {
    this.startRequested$.next(slpFolder);
  }

  public stop(): void {
    this.stopRequested$.next();
  }
}
