import * as path from "path";
import fs from "fs-extra";

import chokidar, { FSWatcher } from "chokidar";
import tailstream, { TailStream } from "tailstream";

import { ManualSlpStream } from "./manualSlpStream";

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
 * @extends {SlpStream}
 */
export class SlpFolderStream extends ManualSlpStream {
  private watcher: FSWatcher | null = null;
  private readStream: TailStream | null = null;
  private currentFilePath: string | null = null;

  /**
   * Starts watching a particular folder for slp files. It treats all new
   * `.slp` files as though it's a live Slippi stream.
   *
   * @param {string} slpFolder
   * @memberof SlpFolderStream
   */
  public async start(slpFolder: string): Promise<void> {
    let initialFiles = await fs.readdir(slpFolder);
    // Convert file paths into absolute paths
    initialFiles = initialFiles.map((file) => {
      return path.resolve(path.join(slpFolder, file));
    });

    // Initialize watcher.
    const slpGlob = path.join(slpFolder, "*.slp");
    this.watcher = chokidar.watch(slpGlob, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
    });
    this.watcher.on("add", (filePath) => {
      if (initialFiles.includes(filePath)) {
        return;
      }

      // We have a newly generated file so end the old stream
      this.endReadStream();

      // Restart the stream
      super.restart();

      this.currentFilePath = filePath;
      // Create a new stream for the new file
      this.readStream = tailstream.createReadStream(filePath);
      this.readStream.on("data", (data: any) => this.write(data));
    });
  }

  private endReadStream(): void {
    if (this.readStream) {
      this.readStream.done();
      this.readStream = null;
    }
  }

  /**
   * Get the current name of the file path that is changing and is being written to.
   *
   * @returns {(string | null)}
   * @memberof SlpFolderStream
   */
  public getCurrentFilename(): string | null {
    if (this.currentFilePath !== null) {
      return path.resolve(this.currentFilePath);
    }
    return null;
  }

  /**
   * Stops all file watching and cleans up.
   *
   * @memberof SlpFolderStream
   */
  public stop(): void {
    if (this.watcher) {
      this.watcher.close();
    }
    if (this.readStream) {
      this.readStream.done();
    }
    this.currentFilePath = null;
    super.stop();
  }

  /**
   * Ends the stream, stopping all file watching.
   *
   * @memberof SlpFolderStream
   */
  public end(): void {
    super.end();
    this.complete();
  }
}
