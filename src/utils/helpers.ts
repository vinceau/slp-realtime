import fs from "fs";
const brake = require("brake");
import type { Observable } from "rxjs";
import { merge } from "rxjs";
import type { Readable, Writable } from "stream";
const Transform = require("readable-stream").Transform;

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

export const pipeFileContentsToFile = async (
  filename: string,
  destination: string,
  speed: Number = 3000,
): Promise<{ readStream: Readable; writeStream: Writable; brakeStream: typeof Transform }> => {
  return new Promise((resolve) => {
    const readStream = fs.createReadStream(filename);

    const writeStream = fs.createWriteStream(destination);

    const brakeStream = brake(speed);

    readStream.pipe(brakeStream).pipe(writeStream);

    readStream.on("open", () => {
      readStream.pipe(brakeStream).pipe(writeStream);

      resolve({ readStream, writeStream, brakeStream });
    });
  });
};
