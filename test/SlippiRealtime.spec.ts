import sinon from "sinon";

import { SlippiRealtime, SlpStream } from "../src";
import { pipeFileContents } from "./helpers";

describe("SlippiRealtime", () => {
  it("emits the correct number of events", async () => {
    const gameStartSpy = sinon.spy();
    const gameEndSpy = sinon.spy();
    const stockSpawnSpy = sinon.spy();
    const stockDeathSpy = sinon.spy();

    const slpStream = new SlpStream({ singleGameMode: true });
    const realtime = new SlippiRealtime(slpStream);
    realtime.on("gameStart", gameStartSpy);
    realtime.on("gameEnd", gameEndSpy);
    realtime.on("spawn", stockSpawnSpy);
    realtime.on("death", stockDeathSpy);

    await pipeFileContents("slp/Game_20190810T162904.slp", slpStream);

    expect(gameStartSpy.callCount).toEqual(1);
    expect(gameEndSpy.callCount).toEqual(1);
    expect(stockSpawnSpy.callCount).toEqual(8);
    expect(stockDeathSpy.callCount).toEqual(7);
  });

});
