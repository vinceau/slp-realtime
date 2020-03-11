import sinon from "sinon";

import { SlpStream } from "../src";
import { pipeFileContents } from "./helpers";
import { Subscription } from "rxjs";

describe("SlpStream", () => {
  let subscriptions: Array<Subscription>;

  beforeAll(() => {
    subscriptions = [];
  });

  afterAll(() => {
    subscriptions.forEach(s => s.unsubscribe());
  });

  describe("when reading from a standard slp file", () => {
    it("emits exactly one game start and one game end event", async () => {
      const gameStartSpy = sinon.spy();
      const gameEndSpy = sinon.spy();

      const slpStream = new SlpStream({ singleGameMode: true });
      const unsubGameStart = slpStream.gameStart$.subscribe(gameStartSpy);
      const unsubGameEnd = slpStream.gameEnd$.subscribe(gameEndSpy);
      subscriptions.push(unsubGameStart, unsubGameEnd);

      // Pipe the file twice
      await pipeFileContents("slp/Game_20190810T162904.slp", slpStream, {end: false});
      await pipeFileContents("slp/Game_20190810T162904.slp", slpStream);

      expect(gameStartSpy.callCount).toEqual(1);
      expect(gameEndSpy.callCount).toEqual(1);
    });

  });

});
