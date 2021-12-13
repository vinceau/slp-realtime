import path from "path";
import fs from "fs";

import { SlpFolderStream } from "../src";

const targetDirectory = path.resolve(__dirname, "..", "slp", "folder-stream");

describe("slpFolderStream", () => {
  let tmpSlpFiles: Array<fs.PathLike>;

  beforeAll(() => {
    tmpSlpFiles = [];
  });

  afterAll(() => {
    tmpSlpFiles.forEach((file) => fs.unlinkSync(file));
  });

  it("starts watching, detects a new file and stops watching", async () => {
    const slpFolderStream = new SlpFolderStream();

    slpFolderStream.start(targetDirectory, true);

    // Generate a random targetFile
    let targetFile = path.resolve(targetDirectory, (Math.random() + 1).toString(36).substring(7) + ".slp");
    tmpSlpFiles.push(targetFile);

    // Copy a slp file to the target directory so slpFolderStream can pick it up
    fs.copyFileSync("slp/Game_20190810T162904.slp", targetFile);

    expect(slpFolderStream.latestFile()).toBe(targetFile);

    // Stop the folder stream and watcher
    slpFolderStream.stop();

    // Generate a new random targetFile
    targetFile = path.resolve(targetDirectory, (Math.random() + 1).toString(36).substring(7) + ".slp");
    tmpSlpFiles.push(targetFile);

    fs.copyFileSync("slp/Game_20190810T162904.slp", targetFile);

    expect(slpFolderStream.latestFile()).not.toBe(targetFile);
  });
});
