import sinon from "sinon";

import { pipeFileContents, SlippiGame, SlpRealTime, RxSlpStream, ComboFilter, Character, SlpStreamMode } from "../src";
import { Subscription } from "rxjs";

describe("combo calculation", () => {
  const filter = new ComboFilter();
  let subscriptions: Array<Subscription>;

  beforeAll(() => {
    subscriptions = [];
  });

  afterAll(() => {
    subscriptions.forEach((s) => s.unsubscribe());
  });

  beforeEach(() => {
    // Reset settings before each test
    filter.resetSettings();
  });

  it("correctly matches combo criteria", async () => {
    const comboSpy = sinon.spy();

    const slpStream = new RxSlpStream({ mode: SlpStreamMode.MANUAL });
    const realtime = new SlpRealTime();
    realtime.setStream(slpStream);

    subscriptions.push(
      realtime.combo.end$.subscribe((payload) => {
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
    const slpStream = new RxSlpStream({ mode: SlpStreamMode.MANUAL });
    const realtime = new SlpRealTime();
    realtime.setStream(slpStream);

    subscriptions.push(
      realtime.combo.end$.subscribe((payload) => {
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
    const slpStream = new RxSlpStream({ mode: SlpStreamMode.MANUAL });
    const realtime = new SlpRealTime();
    realtime.setStream(slpStream);

    subscriptions.push(
      realtime.combo.end$.subscribe((payload) => {
        if (filter.isCombo(payload.combo, payload.settings)) {
          comboSpy();
        }
      }),
    );

    await pipeFileContents("slp/Game_20190810T162904.slp", slpStream);

    // We should have exactly 3 combos that matched the criteria
    expect(comboSpy.callCount).toEqual(3);
  });

  it("emits the correct number of conversions", async () => {
    const conversionSpy = sinon.spy();
    filter.updateSettings({ minComboPercent: 20 });
    const slpStream = new RxSlpStream({ mode: SlpStreamMode.MANUAL });
    const realtime = new SlpRealTime();
    realtime.setStream(slpStream);
    subscriptions.push(
      realtime.combo.conversion$.subscribe((payload) => {
        if (filter.isCombo(payload.combo, payload.settings)) {
          conversionSpy();
        }
      }),
    );
    await pipeFileContents("slp/Game_20190324T113942.slp", slpStream);
    expect(conversionSpy.callCount).toEqual(7);
  });

  it("can support latest patreon build files", async () => {
    const realtime = new SlpRealTime();
    const comboSpy = sinon.spy();

    const filename = "slp/200306_2258_Falco_v_Fox_PS.slp";
    filter.updateSettings({ minComboPercent: 50 });

    const slpStream = new RxSlpStream({ mode: SlpStreamMode.MANUAL });
    realtime.setStream(slpStream);
    subscriptions.push(
      realtime.combo.conversion$.subscribe((payload) => {
        if (filter.isCombo(payload.combo, payload.settings)) {
          comboSpy();
        }
      }),
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

      filter.updateSettings({
        minComboPercent: 40,
        nameTags: ["fizzi"],
        fuzzyNameTagMatching: false,
      });
      const slpStream = new RxSlpStream({ mode: SlpStreamMode.MANUAL });
      realtime.setStream(slpStream);
      subscriptions.push(
        realtime.combo.end$.subscribe((payload) => {
          if (filter.isCombo(payload.combo, payload.settings, metadata)) {
            comboSpy();
          }
        }),
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
      const slpStream = new RxSlpStream({ mode: SlpStreamMode.MANUAL });
      realtime.setStream(slpStream);
      subscriptions.push(
        realtime.combo.end$.subscribe((payload) => {
          if (filter.isCombo(payload.combo, payload.settings, metadata)) {
            comboSpy();
          }
        }),
      );
      await pipeFileContents(filename, slpStream);
      expect(comboSpy.callCount).toEqual(1);
    });

    it("can match combos from Smashladder SLP files", async () => {
      const gameEndSpy = sinon.spy();
      const customComboSpy = sinon.spy();
      const customFilter = new ComboFilter();
      customFilter.updateSettings({
        comboMustKill: false,
        minComboPercent: 40,
      });
      const playerComboSpy = sinon.spy();
      const playerFilter = new ComboFilter();
      playerFilter.updateSettings({
        minComboPercent: 40,
        comboMustKill: false,
        nameTags: ["a_bird"],
      });
      const opponentComboSpy = sinon.spy();
      const opponentFilter = new ComboFilter();
      opponentFilter.updateSettings({
        minComboPercent: 40,
        comboMustKill: false,
        nameTags: ["CptPiplup"],
      });

      const slpStream = new RxSlpStream({ mode: SlpStreamMode.MANUAL, suppressErrors: false });
      const realtime = new SlpRealTime();
      realtime.setStream(slpStream);

      const slippiGame = new SlippiGame("slp/Smashladder_200517_1613_Falcon_v_Falcon_PS.slp");
      const metadata = slippiGame.getMetadata();

      subscriptions.push(
        realtime.game.end$.subscribe(gameEndSpy),
        realtime.combo.conversion$.subscribe((payload) => {
          if (customFilter.isCombo(payload.combo, payload.settings, metadata)) {
            customComboSpy();
          }
          if (playerFilter.isCombo(payload.combo, payload.settings, metadata)) {
            playerComboSpy();
          }
          if (opponentFilter.isCombo(payload.combo, payload.settings, metadata)) {
            opponentComboSpy();
          }
        }),
      );

      await pipeFileContents("slp/Smashladder_200517_1613_Falcon_v_Falcon_PS.slp", slpStream);

      // If we successfully parsed the entire file, we should get a game end payload
      expect(gameEndSpy.callCount).toEqual(1);
      // We should have exactly 3 combos that matched the criteria
      expect(customComboSpy.callCount).toEqual(3);
      // The combos should belong to either the player or the opponent
      expect(customComboSpy.callCount).toEqual(playerComboSpy.callCount + opponentComboSpy.callCount);
      expect(playerComboSpy.callCount).toEqual(2);
      expect(opponentComboSpy.callCount).toEqual(1);
    });

    it("can do fuzzy nametag matching", async () => {
      const gameEndSpy = sinon.spy();
      const strictMatch = sinon.spy();
      const strictFilter = new ComboFilter();
      strictFilter.updateSettings({
        minComboPercent: 40,
        comboMustKill: false,
        nameTags: ["a bird", "cptpiplup"],
        fuzzyNameTagMatching: false,
      });
      const underscoreMatch = sinon.spy();
      const underscoreFilter = new ComboFilter();
      underscoreFilter.updateSettings({
        minComboPercent: 40,
        comboMustKill: false,
        nameTags: ["a bird"],
        fuzzyNameTagMatching: true,
      });
      const caseInsensitiveMatch = sinon.spy();
      const caseInsensitiveFilter = new ComboFilter();
      caseInsensitiveFilter.updateSettings({
        minComboPercent: 40,
        comboMustKill: false,
        nameTags: ["cptpiplup"],
        fuzzyNameTagMatching: true,
      });

      const slpStream = new RxSlpStream({ mode: SlpStreamMode.MANUAL, suppressErrors: false });
      const realtime = new SlpRealTime();
      realtime.setStream(slpStream);

      const slippiGame = new SlippiGame("slp/Smashladder_200517_1613_Falcon_v_Falcon_PS.slp");
      const metadata = slippiGame.getMetadata();

      subscriptions.push(
        realtime.game.end$.subscribe(gameEndSpy),
        realtime.combo.conversion$.subscribe((payload) => {
          if (strictFilter.isCombo(payload.combo, payload.settings, metadata)) {
            strictMatch();
          }
          if (underscoreFilter.isCombo(payload.combo, payload.settings, metadata)) {
            underscoreMatch();
          }
          if (caseInsensitiveFilter.isCombo(payload.combo, payload.settings, metadata)) {
            caseInsensitiveMatch();
          }
        }),
      );

      await pipeFileContents("slp/Smashladder_200517_1613_Falcon_v_Falcon_PS.slp", slpStream);

      // If we successfully parsed the entire file, we should get a game end payload
      expect(gameEndSpy.callCount).toEqual(1);
      expect(strictMatch.callCount).toEqual(0);
      expect(underscoreMatch.callCount).toEqual(2);
      expect(caseInsensitiveMatch.callCount).toEqual(1);
    });
  });
});
