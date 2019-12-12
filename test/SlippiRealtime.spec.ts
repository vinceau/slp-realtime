import fs from 'fs';
import sinon from "sinon";

import { SlippiRealtime, SlpStream } from '../src';

describe('SlippiRealtime', () => {
  beforeEach(() => {
    jest.setTimeout(1000000);
  });

  it('emits the correct number of events', async () => {
    const gameStartSpy = sinon.spy();
    const gameEndSpy = sinon.spy();
    const stockSpawnSpy = sinon.spy();
    const stockDeathSpy = sinon.spy();

    await new Promise((resolve): void => {
      const readStream = fs.createReadStream("slp/Game_20190810T162904.slp");
      const slpStream = new SlpStream({ singleGameMode: true });
      const realtime = new SlippiRealtime(slpStream);

      readStream.on('open', () => {
        readStream.pipe(slpStream);
      });
      readStream.on("close", () => {
        resolve();
      });

      realtime.on("gameStart", gameStartSpy);
      realtime.on("gameEnd", gameEndSpy);
      realtime.on("spawn", stockSpawnSpy);
      realtime.on("death", stockDeathSpy);
    });

    expect(gameStartSpy.callCount).toEqual(1);
    expect(gameEndSpy.callCount).toEqual(1);
    expect(stockSpawnSpy.callCount).toEqual(8);
    expect(stockDeathSpy.callCount).toEqual(7);
  });

});
