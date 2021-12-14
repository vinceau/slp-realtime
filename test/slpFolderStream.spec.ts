import path from "path";
import fs from "fs";
const { copyFile, mkdir } = fs.promises;

import { SlpFolderStream } from "../src";

describe("slpFolderStream", () => {
  let tmpTargetDirectory: string = path.resolve(__dirname, "..", "slp", "tmp");

  beforeAll(async () => {
    await mkdir(tmpTargetDirectory, { recursive: true });
  });

  afterAll(async () => {
    fs.rmdirSync(tmpTargetDirectory, { recursive: true });
  });

  let randomSlpFilename = (): string => (Math.random() + 1).toString(36).substring(7) + ".slp";

  it("starts watching, detects a new file and stops watching", async () => {
    const slpFolderStream = new SlpFolderStream();

    slpFolderStream.start(tmpTargetDirectory, true);

    // Wait for Chokidar to be ready
    await new Promise<void>((resolve, reject) => {
      slpFolderStream.watcher ? slpFolderStream.watcher.once("ready", resolve) : reject();
    });

    // Generate a random targetFile
    let targetFile = path.resolve(tmpTargetDirectory, randomSlpFilename());

    await copyFile("slp/Game_20190810T162904.slp", targetFile);

    // Wait for Chokidar to be pick up the file
    await new Promise<void>((resolve, reject) => {
      slpFolderStream.watcher ? slpFolderStream.watcher.once("add", resolve) : reject();
    });

    expect(slpFolderStream.latestFile()).toBe(targetFile);

    // Stop the folder stream
    slpFolderStream.stop();
  });
});
