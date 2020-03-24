import sinon from "sinon";

import { SlippiGame, SlpRealTime, SlpStream, ComboFilter, Character, EventManager, EventManagerConfig, ComboEvent } from "../../src";
import { pipeFileContents } from "../helpers";
import { Subscription } from "rxjs";

describe("combo config", () => {
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

  it("correctly matches default combo config criteria", async () => {
    const allComboSpy = sinon.spy();
    const comboSpy = sinon.spy();

    const slpStream = new SlpStream({ singleGameMode: true });
    const realtime = new SlpRealTime();
    const eventManager = new EventManager(realtime);
    realtime.setStream(slpStream);

    const config: EventManagerConfig = {
      events: [
        {
          id: "combo-end-id",
          type: ComboEvent.END,
        },
        {
          id: "combo-match-id",
          type: ComboEvent.MATCH,
        },
      ]
    };

    eventManager.updateConfig(config);

    subscriptions.push(
      eventManager.events$.subscribe(event => {
        switch (event.id) {
        case "combo-end-id":
          allComboSpy();
          break;
        case "combo-match-id":
          comboSpy();
          break;
        }
      })
    );

    await pipeFileContents("slp/Game_20190810T162904.slp", slpStream);

    expect(allComboSpy.callCount).toEqual(42);
    // We should have exactly 1 combo that matched the criteria
    expect(comboSpy.callCount).toEqual(1);
  });

  it("can filter by character", async () => {
    const bowserOnlySpy = sinon.spy();

    const excludesBowserSpy = sinon.spy();

    const config: EventManagerConfig = {
      variables: {
        $onlyBowser: { characterFilter: [Character.BOWSER] },
        $onlyFalcon: { characterFilter: [Character.CAPTAIN_FALCON] },
      },
      events: [
        {
          id: "only-bowser-events",
          type: ComboEvent.MATCH,
          filter: {
            comboCriteria: "$onlyBowser",
          },
        },
        {
          id: "only-falcon-events",
          type: ComboEvent.MATCH,
          filter: {
            comboCriteria: "$onlyFalcon",
          },
        },
      ]
    };
    const slpStream = new SlpStream({ singleGameMode: true });
    const realtime = new SlpRealTime();
    realtime.setStream(slpStream);
    const eventManager = new EventManager(realtime);
    eventManager.updateConfig(config);

    subscriptions.push(
      eventManager.events$.subscribe(event => {
        switch (event.id) {
        case "only-bowser-events":
          bowserOnlySpy();
          break;
        case "only-falcon-events":
          excludesBowserSpy();
          break;
        }
      }),
    );

    await pipeFileContents("slp/Game_20190810T162904.slp", slpStream);

    expect(bowserOnlySpy.callCount).toEqual(0);
    expect(excludesBowserSpy.callCount).toEqual(1);
  });

  it("can filter by min combo percent config", async () => {
    const comboSpy = sinon.spy();

    const slpStream = new SlpStream({ singleGameMode: true });
    const realtime = new SlpRealTime();
    const eventManager = new EventManager(realtime);
    eventManager.updateConfig({
      events: [
        {
          id: "min-combo-event",
          type: ComboEvent.MATCH,
          filter: {
            comboCriteria: { minComboPercent: 20 },
          },
        }
      ],
    });
    realtime.setStream(slpStream);

    subscriptions.push(
      eventManager.events$.subscribe(event => {
        switch (event.id) {
        case "min-combo-event":
          comboSpy();
          break;
        }
      })
    );

    await pipeFileContents("slp/Game_20190810T162904.slp", slpStream);

    // We should have exactly 3 combos that matched the criteria
    expect(comboSpy.callCount).toEqual(3);
  });

  /*
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
  */

});
