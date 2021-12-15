import sinon from "sinon";
import path from "path";
import fs from "fs-extra";

import { SlpFolderStream } from "../src";
import type { Subscription } from "rxjs";

const tmpTargetDirectory = path.resolve(__dirname, "..", "slp", "tmp");

describe("slpFolderStream", () => {
  let slpFolderStream: SlpFolderStream;
  let subscriptions: Array<Subscription>;

  beforeAll(() => {
    subscriptions = [];
    fs.ensureDirSync(tmpTargetDirectory);
  });

  afterAll(() => {
    subscriptions.forEach((s) => s.unsubscribe());
    fs.removeSync(tmpTargetDirectory);
  });

  beforeEach(() => {
    slpFolderStream = new SlpFolderStream();
  });

  it("should be able to start and stop detecting files", async () => {
    const gameStartSpy = sinon.spy();
    await slpFolderStream.start(tmpTargetDirectory, { includeSubfolders: true });

    subscriptions.push(slpFolderStream.gameStart$.subscribe(() => gameStartSpy()));

    // Ensure we can detect the new file
    const targetFile = path.resolve(tmpTargetDirectory, randomSlpFilename());
    await fs.copyFile("slp/Game_20190810T162904.slp", targetFile);
    await delay();
    expect(slpFolderStream.latestFile()).toBe(targetFile);
    expect(gameStartSpy.callCount).toEqual(1);

    // Ensure that calling stop will actually stop detecting files
    slpFolderStream.stop();

    const newTargetFile = path.resolve(tmpTargetDirectory, randomSlpFilename());
    await fs.copyFile("slp/Game_20190810T162904.slp", newTargetFile);
    await delay();

    // The last file should still be the old file name
    expect(slpFolderStream.latestFile()).toBe(targetFile);
    expect(gameStartSpy.callCount).toEqual(1);
  });
});

const randomSlpFilename = (): string => (Math.random() + 1).toString(36).substring(7) + ".slp";

const delay = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms));
