const path = require("path");
const targetDirectory = path.resolve(__dirname, "..", "slp", "folder-stream");
const fs = require("fs");

import { pipeFileContentsToFile } from "../src";

const { SlpFolderStream } = require("../src");

describe("slpFolderStream", () => {
  let tmpSlpFiles: Array<String>;

  beforeAll(() => {
    tmpSlpFiles = [];
  });

  afterAll(() => {
    tmpSlpFiles.forEach((file) => fs.unlinkSync(file));
  });

  it("can be initialised", async () => {
    const slpFolderStream = new SlpFolderStream();
    expect(slpFolderStream).toBeInstanceOf(SlpFolderStream);
  });

  it("starts watching, detects a new file and stops watching", async () => {
    const slpFolderStream = new SlpFolderStream();

    slpFolderStream.start(targetDirectory, true);

    // Generate a random targetFile
    let targetFile = path.resolve(targetDirectory, (Math.random() + 1).toString(36).substring(7) + ".slp");

    // Push for cleanup
    tmpSlpFiles.push(targetFile);

    // TODO - This is a hack to get around the folder stream not being ready yet before pipeFileContentsToFile starts writing to the targetFile
    await new Promise((resolve) => setTimeout(resolve, 250));

    // Pipe an slp file to the targetFile
    const { stopPipeStream } = await pipeFileContentsToFile("slp/Game_20190810T162904.slp", targetFile);

    // TODO - This is a hack to get around the folder stream not being ready yet before pipeFileContentsToFile starts writing to the targetFile
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(slpFolderStream.latestFile()).toBe(targetFile);

    // Stop the folder stream and watcher
    slpFolderStream.stop();

    // After stopping, the watcher should be null
    expect(slpFolderStream.getWatcher()).toBe(null);

    // Stop the tmp stream
    stopPipeStream();
  });
});
