import sinon from "sinon";

import { pipeFileContents, SlpRealTime, ManualSlpStream } from "../src";
import { Subscription } from "rxjs";

describe("SlpRealTime", () => {
  let subscriptions: Array<Subscription>;

  beforeAll(() => {
    subscriptions = [];
  });

  afterAll(() => {
    subscriptions.forEach((s) => s.unsubscribe());
  });

  it("emits the correct number of events", async () => {
    const gameStartSpy = sinon.spy();
    const gameEndSpy = sinon.spy();
    const stockSpawnSpy = sinon.spy();
    const stockDeathSpy = sinon.spy();

    const slpStream = new ManualSlpStream();
    const realtime = new SlpRealTime();
    realtime.setStream(slpStream);

    subscriptions.push(
      realtime.game.start$.subscribe(gameStartSpy),
      realtime.game.end$.subscribe(gameEndSpy),
      realtime.stock.playerSpawn$.subscribe(stockSpawnSpy),
      realtime.stock.playerDied$.subscribe(stockDeathSpy),
    );

    await pipeFileContents("slp/Game_20190810T162904.slp", slpStream);

    expect(gameStartSpy.callCount).toEqual(1);
    expect(gameEndSpy.callCount).toEqual(1);
    expect(stockSpawnSpy.callCount).toEqual(8);
    expect(stockDeathSpy.callCount).toEqual(7);
  });
});
