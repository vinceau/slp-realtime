import fs from "fs";

import { Writable } from "stream";

export const pipeFileContents = async (filename: string, destination: Writable): Promise<void> => {
  return new Promise((resolve): void => {
    const readStream = fs.createReadStream(filename);
    readStream.on("open", () => {
      readStream.pipe(destination);
    });
    readStream.on("close", () => {
      resolve();
    });
  });

};