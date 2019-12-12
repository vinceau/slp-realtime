import sinon from "sinon";

import { SlippiRealtime, SlpStream, ComboFilter } from '../src';
import { pipeFileContents }  from "../src/utils/testHelper";

describe('combo calculation', () => {
  const filter = new ComboFilter();

  beforeEach(() => {
    // Reset settings before each test
    filter.resetSettings();
  });

  it('correctly matches combo criteria', async () => {
    const comboSpy = sinon.spy();

    const slpStream = new SlpStream({ singleGameMode: true });
    const realtime = new SlippiRealtime(slpStream);

    realtime.on("comboEnd", (c, s) => {
      if (filter.isCombo(c, s)) {
        comboSpy();
      }
    });

    await pipeFileContents("slp/Game_20190810T162904.slp", slpStream);

    // We should have exactly 1 combo that matched the criteria
    expect(comboSpy.callCount).toEqual(1);
  });

  it('can update combo settings', async () => {
    const comboSpy = sinon.spy();

    filter.updateSettings({ minComboPercent: 20 });
    const slpStream = new SlpStream({ singleGameMode: true });
    const realtime = new SlippiRealtime(slpStream);

    realtime.on("comboEnd", (c, s) => {
      if (filter.isCombo(c, s)) {
        comboSpy();
      }
    });

    await pipeFileContents("slp/Game_20190810T162904.slp", slpStream);

    // We should have exactly 3 combos that matched the criteria
    expect(comboSpy.callCount).toEqual(3);
  });

});
