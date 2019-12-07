import fs from 'fs';

import { SlpStream, SlippiRealtime } from '../src';

describe('when reading realtime events', () => {

  it('emits the correct number of events', (done) => {
    const readStream = fs.createReadStream("slp/Game_20190810T162904.slp");
    const slpStream = new SlpStream();
    const realtime = new SlippiRealtime(slpStream);
    // This will wait until we know the readable stream is actually valid before piping
    readStream.on('open', () => {
      // This just pipes the read stream to the response object (which goes to the client)
      readStream.pipe(slpStream);
    });
    readStream.on("close", () => {
      done();
    })
    realtime.on("gameStart", () => {
      console.log('game start');
    });
    realtime.on("gameEnd", () => {
      console.log('game end');
    });
    realtime.on("comboStart", () => {
      console.log("combo start");
    });
    realtime.on("comboExtend", () => {
      console.log('combo extend');
    });
    realtime.on("comboEnd", () => {
      console.log('combo end');
    });
    realtime.on("spawn", () => {
      console.log("spawn");
    });
    realtime.on("death", () => {
      console.log("death");
    });
  });

});