import fs from 'fs';
import sinon from "sinon";

import { SlpStream } from '../src';

describe('when reading realtime events', () => {

  it('emits the correct number of events', async () => {
    const gameStartSpy = sinon.spy();
    const gameEndSpy = sinon.spy();

    await new Promise((resolve): void => {
      const readStream = fs.createReadStream("slp/Game_20190910T225823.slp");
      const slpStream = new SlpStream({ singleGameMode: true });

      // This will wait until we know the readable stream is actually valid before piping
      readStream.on('open', () => {
        // This just pipes the read stream to the response object (which goes to the client)
        readStream.pipe(slpStream);
      });
      readStream.on("close", () => {
        resolve();
      });

      slpStream.on("gameStart", gameStartSpy);
      slpStream.on("gameEnd", gameEndSpy);
    });

    expect(gameStartSpy.callCount).toEqual(1);
    expect(gameEndSpy.callCount).toEqual(1);

    // realtime.on("comboStart", () => {
    //   console.log("combo start");
    // });
    // realtime.on("comboExtend", () => {
    //   console.log('combo extend');
    // });
    // realtime.on("comboEnd", () => {
    //   console.log('combo end');
    // });

  });

});