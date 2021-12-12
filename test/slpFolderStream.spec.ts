const path = require("path");
const targetDirectory = path.resolve(__dirname, "..", "slp", "folder-stream");
const fs = require("fs");
const brake = require("brake");
import { pipeFileContentsToFile } from "../src";

const { SlpFolderStream, SlpRealTime } = require("../src");

describe("slpFolderStream", () => {
  let tmpSlpFiles: Array<String>;

  beforeAll(() => {
    tmpSlpFiles = [];
  });

  afterAll(() => {
    tmpSlpFiles.forEach((file) => fs.unlinkSync(file));
  });

  describe("when watching a folder for new slp files", () => {
    it("detects a new file", async () => {
      const slpFolderStream = new SlpFolderStream();

      slpFolderStream.start(targetDirectory, true);

      // Generate a random targetFile
      let targetFile = path.resolve(targetDirectory, (Math.random() + 1).toString(36).substring(7) + ".slp");

      // Push for cleanup
      tmpSlpFiles.push(targetFile);

      // Start piping a demo file to the targetFile
      const { readStream, writeStream, brakeStream } = await pipeFileContentsToFile(
        "slp/Game_20190810T162904.slp",
        targetFile,
      );

      // Close up streams
      readStream.destroy();
      writeStream.destroy();
      brakeStream.destroy();
      readStream.unpipe(writeStream);
    });
  });
});
