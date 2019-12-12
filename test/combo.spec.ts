import fs from 'fs';
import sinon from "sinon";

import { SlippiRealtime, SlpStream, ComboFilter } from '../src';

describe('combo calculation', () => {
  beforeEach(() => {
    jest.setTimeout(1000000);
  });

  it('correctly matches combo criteria', async () => {
    const comboSpy = sinon.spy();

    const filter = new ComboFilter();

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

      realtime.on("comboEnd", (c, s) => {
        if (filter.isCombo(c, s)) {
          comboSpy();
        }
      });
    });

    // We should have exactly 1 combo that matched the criteria
    expect(comboSpy.callCount).toEqual(1);
  });

});
