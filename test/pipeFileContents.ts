import fs from "fs";

interface Processable {
  process(data: Uint8Array): void;
}

export const pipeFileContents = async (filename: string, destination: Processable): Promise<void> => {
  return new Promise((resolve): void => {
    fs.readFile(filename, (err, data) => {
      if (err) {
        throw err;
      }
      destination.process(new Uint8Array(data));
      resolve();
    });
  });
};
