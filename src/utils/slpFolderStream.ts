import * as path from "path";
import chokidar from "chokidar";
import fs from "fs";
import tailstream from "tailstream";

import { SlpStream } from "./slpStream";

export class SlpFolderStream extends SlpStream {
  public constructor(slpFolder: string) {
    super();
    const initialFiles = fs.readdirSync(slpFolder).map(file =>
      path.resolve(path.join(slpFolder, file))
    );
    console.log("found: ", initialFiles);

    const slpGlob = path.join(slpFolder, "*.slp");
    let readStream: any = null;

    // Initialize watcher.
    const watcher = chokidar.watch(slpGlob, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true
    });
    watcher
      .on("add", path => {
        if (initialFiles.includes(path)) {
          console.log(`${path} is an old file`);
        } else {
          console.log(`File ${path} is a new file`)
          if (readStream) {
            // End the stream
            readStream.done()
          }
          readStream = tailstream.createReadStream(path);
          readStream.on("data", (data: any) => this.write(data));
        }
      });
  }
}