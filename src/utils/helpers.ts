import fs from "fs";

import { Observable, merge } from "rxjs";
import { Writable } from "stream";

export const forAllPlayerIndices = <T>(func: (index: number) => Observable<T> ): Observable<T> => {
  return merge(
    func(0),
    func(1),
    func(2),
    func(3),
  );
}

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