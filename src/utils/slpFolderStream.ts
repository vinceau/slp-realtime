import * as path from "path";
import chokidar from "chokidar";
import fs from "fs";
import tailstream from "tailstream";

import { SlpStream } from "./slpStream";
import { SlippiRealtime } from "../realtime";

const stream = new SlpStream({ logErrors: true });
stream.on("error", (err) => {
  console.log("an error occurred in stream");
  console.error(err);
});
const realtime = new SlippiRealtime(stream);
realtime.on("gameStart", () => {
  console.log("game started");
});
realtime.on("gameEnd", () => {
  console.log("game ended");
});
realtime.on("spawn", () => {
  console.log("someone spawned");
});
realtime.on("death", () => {
  console.log("someone died");
});
realtime.on("comboEnd", () => {
  console.log("a combo ended");
});

const slpFolder = "C:\\Users\\Vince\\Documents\\FM-v5.9-Slippi-r18-Win\\Slippi";
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
      readStream.on("data", (data: any) => stream.write(data));
    }
  });
