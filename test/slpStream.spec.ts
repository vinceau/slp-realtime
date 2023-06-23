import * as sinon from "sinon";

import { RxSlpStream, pipeFileContents } from "../src";
import { Subscription } from "rxjs";
import { SlpStreamMode } from "@slippi/slippi-js";

describe("SlpStream", () => {
  let subscriptions: Array<Subscription>;

  beforeAll(() => {
    subscriptions = [];
  });

  afterAll(() => {
    subscriptions.forEach((s) => s.unsubscribe());
  });

  describe("when reading from standard slp files", () => {
    it("emits exactly one game start and one game end event in single game mode", async () => {
      const gameStartSpy = sinon.spy();
      const gameEndSpy = sinon.spy();

      const slpStream = new RxSlpStream({ mode: SlpStreamMode.MANUAL });
      const unsubGameStart = slpStream.gameStart$.subscribe(gameStartSpy);
      const unsubGameEnd = slpStream.gameEnd$.subscribe(gameEndSpy);
      subscriptions.push(unsubGameStart, unsubGameEnd);

      // Pipe the file twice
      await pipeFileContents("slp/Game_20190810T162904.slp", slpStream, { end: false });
      await pipeFileContents("slp/Game_20190810T162904.slp", slpStream);
      // slpStream.complete();

      expect(gameStartSpy.callCount).toEqual(1);
      expect(gameEndSpy.callCount).toEqual(1);
    });

    it("emits multiple events when not in single game mode", async () => {
      const gameStartSpy = sinon.spy();
      const gameEndSpy = sinon.spy();

      const slpStream = new RxSlpStream({ mode: SlpStreamMode.MANUAL });
      const unsubGameStart = slpStream.gameStart$.subscribe(gameStartSpy);
      const unsubGameEnd = slpStream.gameEnd$.subscribe(gameEndSpy);
      subscriptions.push(unsubGameStart, unsubGameEnd);

      // Pipe the file twice
      await pipeFileContents("slp/Game_20190810T162904.slp", slpStream, { end: false });
      slpStream.restart();
      await pipeFileContents("slp/Game_20190810T162904.slp", slpStream);

      expect(gameStartSpy.callCount).toEqual(2);
      expect(gameEndSpy.callCount).toEqual(2);
    });
  });
});
