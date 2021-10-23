import { SlippiGame } from "@slippi/slippi-js";
import { ComboFilter, Character } from "../src";

describe("can match combos for rollback slp files", () => {
  it("can filter by slippi connect codes", async () => {
    // This should match 5
    const comboFilter = new ComboFilter();
    comboFilter.updateSettings({ minComboPercent: 30, comboMustKill: false });

    // This should match 2
    const codeFilter = new ComboFilter();
    codeFilter.updateSettings({ nameTags: ["va#0"], minComboPercent: 30, comboMustKill: false });

    // This should match 0
    const strictCodeFilter = new ComboFilter();
    strictCodeFilter.updateSettings({
      nameTags: ["va#0"],
      minComboPercent: 30,
      comboMustKill: false,
      fuzzyNameTagMatching: false,
    });

    // This should match the same as above (2)
    const charFilter = new ComboFilter();
    charFilter.updateSettings({ characterFilter: [Character.MARIO], minComboPercent: 30, comboMustKill: false });

    const game = new SlippiGame("slp/Game_20200701T191315-rb-codes.slp");
    const settings = game.getSettings();
    const md = game.getMetadata();
    const stats = game.getStats();
    const comboMatched = stats.conversions.filter((c) => comboFilter.isCombo(c, settings));
    const codeMatched = stats.conversions.filter((c) => codeFilter.isCombo(c, settings, md));
    const strictCodeMatched = stats.conversions.filter((c) => strictCodeFilter.isCombo(c, settings, md));
    const charMatched = stats.conversions.filter((c) => charFilter.isCombo(c, settings, md));

    expect(comboMatched.length).toEqual(5);
    expect(codeMatched.length).toEqual(2);
    expect(strictCodeMatched.length).toEqual(0);
    expect(charMatched.length).toEqual(2);
  });
});
