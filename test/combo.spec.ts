import sinon from "sinon";

import { SlippiGame, SlpRealTime, SlpStream, ComboFilter, Character } from "../src";
import { pipeFileContents } from "./helpers";
import { Subscription } from "rxjs";

describe("combo calculation", () => {
  const filter = new ComboFilter();
  let subscriptions: Array<Subscription>;

  beforeAll(() => {
    subscriptions = [];
  });

  afterAll(() => {
    subscriptions.forEach(s => s.unsubscribe());
  });

  beforeEach(() => {
    // Reset settings before each test
    filter.resetSettings();
  });

  it("correctly matches combo criteria", async () => {
    const comboSpy = sinon.spy();

    const slpStream = new SlpStream({ singleGameMode: true });
    const realtime = new SlpRealTime();
    realtime.setStream(slpStream);

    subscriptions.push(
      realtime.combo.end$.subscribe(payload => {
        if (filter.isCombo(payload.combo, payload.settings)) {
          comboSpy();
        }
      }),
    );

    await pipeFileContents("slp/Game_20190810T162904.slp", slpStream);

    // We should have exactly 1 combo that matched the criteria
    expect(comboSpy.callCount).toEqual(1);
  });

  it("can filter by character", async () => {
    const bowserOnlySpy = sinon.spy();
    const bowserOnlyFilter = new ComboFilter();

    const excludesBowserSpy = sinon.spy();
    const excludesBowserFilter = new ComboFilter();

    bowserOnlyFilter.updateSettings({ characterFilter: [Character.BOWSER] });
    excludesBowserFilter.updateSettings({ characterFilter: [Character.CAPTAIN_FALCON] });
    const slpStream = new SlpStream({ singleGameMode: true });
    const realtime = new SlpRealTime();
    realtime.setStream(slpStream);

    subscriptions.push(
      realtime.combo.end$.subscribe(payload => {
        const c = payload.combo;
        const s = payload.settings;
        if (bowserOnlyFilter.isCombo(c, s)) {
          bowserOnlySpy();
        }
        if (excludesBowserFilter.isCombo(c, s)) {
          excludesBowserSpy();
        }
      }),
    );

    await pipeFileContents("slp/Game_20190810T162904.slp", slpStream);

    expect(bowserOnlySpy.callCount).toEqual(0);
    expect(excludesBowserSpy.callCount).toEqual(1);
  });

  it("can update combo settings", async () => {
    const comboSpy = sinon.spy();

    filter.updateSettings({ minComboPercent: 20 });
    const slpStream = new SlpStream({ singleGameMode: true });
    const realtime = new SlpRealTime();
    realtime.setStream(slpStream);

    subscriptions.push(
      realtime.combo.end$.subscribe((payload) => {
        if (filter.isCombo(payload.combo, payload.settings)) {
          comboSpy();
        }
      })
    );

    await pipeFileContents("slp/Game_20190810T162904.slp", slpStream);

    // We should have exactly 3 combos that matched the criteria
    expect(comboSpy.callCount).toEqual(3);
  });

  it("emits the correct number of conversions", async () => {
    const conversionSpy = sinon.spy();
    filter.updateSettings({ minComboPercent: 20 });
    const slpStream = new SlpStream({ singleGameMode: true });
    const realtime = new SlpRealTime();
    realtime.setStream(slpStream);
    subscriptions.push(
      realtime.combo.conversion$.subscribe((payload) => {
        if (filter.isCombo(payload.combo, payload.settings)) {
          conversionSpy();
        }
      })
    );
    await pipeFileContents("slp/Game_20190324T113942.slp", slpStream);
    expect(conversionSpy.callCount).toEqual(7);
  });

  it("can support latest patreon build files", async () => {
    const realtime = new SlpRealTime();
    const comboSpy = sinon.spy();

    const filename = "slp/200306_2258_Falco_v_Fox_PS.slp";
    filter.updateSettings({ minComboPercent: 50 });

    const slpStream = new SlpStream({ singleGameMode: true });
    realtime.setStream(slpStream);
    subscriptions.push(
      realtime.combo.conversion$.subscribe((payload) => {
        if (filter.isCombo(payload.combo, payload.settings)) {
          comboSpy();
        }
      })
    );
    await pipeFileContents(filename, slpStream);
    expect(comboSpy.callCount).toEqual(2);
  });

  describe("when filtering netplay names", () => {
    it("can correctly filter netplay names", async () => {
      const realtime = new SlpRealTime();
      const comboSpy = sinon.spy();

      const filename = "slp/Game_20190517T164215.slp";
      const game = new SlippiGame(filename);
      const metadata = game.getMetadata();

      filter.updateSettings({ minComboPercent: 40, nameTags: ["fizzi"] });
      const slpStream = new SlpStream({ singleGameMode: true });
      realtime.setStream(slpStream);
      subscriptions.push(
        realtime.combo.end$.subscribe((payload) => {
          if (filter.isCombo(payload.combo, payload.settings, metadata)) {
            comboSpy();
          }
        })
      );

      await pipeFileContents(filename, slpStream);
      expect(comboSpy.callCount).toEqual(0);
    });

    it("can correctly match netplay names", async () => {
      const realtime = new SlpRealTime();
      const comboSpy = sinon.spy();

      const filename = "slp/Game_20190517T164215.slp";
      const game = new SlippiGame(filename);
      const metadata = game.getMetadata();

      filter.updateSettings({ minComboPercent: 40, nameTags: ["Fizzi"] });
      const slpStream = new SlpStream({ singleGameMode: true });
      realtime.setStream(slpStream);
      subscriptions.push(
        realtime.combo.end$.subscribe((payload) => {
          if (filter.isCombo(payload.combo, payload.settings, metadata)) {
            comboSpy();
          }
        })
      );
      await pipeFileContents(filename, slpStream);
      expect(comboSpy.callCount).toEqual(1);
    });

  });

});
