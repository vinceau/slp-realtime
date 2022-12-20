import fs from "fs";
import type { Observable } from "rxjs";
import { merge } from "rxjs";
import type { Writable } from "stream";

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

/**
 * Checks whether 2 arrays' values are equivalent
 * @template T Any type that supports equality check
 * @param arrA
 * @param arrB
 * @returns Whether the 2 supplied arrays match the same elements in the same order
 */
export const isEquivalentArray = <T>(arrA: T[], arrB: T[]): boolean => {
  if (arrA.length !== arrB.length) return false;
  for (let i = 0; i < arrA.length; i++) {
    if (arrA[i] !== arrB[i]) {
      return false;
    }
  }
  return true;
};
