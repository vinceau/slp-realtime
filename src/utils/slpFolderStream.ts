import * as path from "path";
import chokidar from "chokidar";
import fs from "fs";
import tailstream from "tailstream";

import { SlpStream } from "./slpStream";

export class SlpFolderStream extends SlpStream {
  private readStream: any = null;

  public constructor(slpFolder: string) {
    super();
    this._startWatching(slpFolder);
  }

  public end(): void {
    super.end();
    this.readStream.done();
  }

  private _startWatching(slpFolder: string): void {
    const initialFiles = fs.readdirSync(slpFolder).map(file =>
      path.resolve(path.join(slpFolder, file))
    );
    const slpGlob = path.join(slpFolder, "*.slp");

    // Initialize watcher.
    const watcher = chokidar.watch(slpGlob, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true
    });
    watcher.on("add", path => {
      if (initialFiles.includes(path)) {
        return;
      }
      // This is a newly generated file
      if (this.readStream) {
        // End the old stream
        this.readStream.done();
      }
      // Create a new stream for the new file
      this.readStream = tailstream.createReadStream(path);
      this.readStream.on("data", (data: any) => this.write(data));
    });
  }
}