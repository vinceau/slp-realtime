import fs from "fs";
const brake = require("brake");
import type { Observable } from "rxjs";
import { merge } from "rxjs";
import type { Readable, Writable } from "stream";

export const forAllPlayerIndices = <T>(func: (index: number) => Observable<T>): Observable<T> => {
  return merge(func(0), func(1), func(2), func(3));
};

export const pipeFileContents = async (filename: string, destination: Writable, options?: any): Promise<void> => {
  return new Promise((resolve): void => {
    const readStream = fs.createReadStream(filename);
    readStream.on("open", () => {
      readStream.pipe(destination, options);
    });
    readStream.on("close", () => {
      resolve();
    });
  });
};

// TODO - Resolve when the stream has actually started
export const pipeFileContentsToFile = async (
  filename: string,
  destination: string,
  slow: boolean = true,
): Promise<{
  readStream: Readable;
  writeStream: Writable;
  brakeStream: typeof brake;
  stopPipeStream: Function;
}> => {
  return new Promise((resolve) => {
    const writeStream = fs.createWriteStream(destination);
    const readStream = fs.createReadStream(filename);
    // Brake will slow down the stream by the given speed, this is useful for testing SlpFolderStreams
    const brakeStream = brake(2e4);

    if (slow) {
      readStream.pipe(brakeStream).pipe(writeStream);
    } else {
      readStream.pipe(writeStream);
    }

    let stopPipeStream = () => {
      readStream.unpipe(writeStream).unpipe(brakeStream);
      readStream.destroy();
      writeStream.destroy();
      brakeStream.destroy();
    };

    resolve({ readStream, writeStream, brakeStream, stopPipeStream });
  });
};
