import fs from "fs";

export const sleep = (ms: number): Promise<void> => new Promise((resolve): NodeJS.Timeout => setTimeout(resolve, ms))

export const promiseTimeout = <T>(ms: number, promise: Promise<T>): Promise<T> => {
  // Create a promise that rejects in <ms> milliseconds
  const timeout = new Promise((resolve, reject): void => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(`Timed out after ${ms}ms.`))
    }, ms)
  })

  // Returns a race between our timeout and the passed in promise
  return Promise.race([promise, timeout]) as Promise<T>;
}

export const readDir = (folderPath: string, options?: any): Promise<string[]> => {
  return new Promise((resolve, reject): void => {
    fs.readdir(folderPath, options, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  })
}
