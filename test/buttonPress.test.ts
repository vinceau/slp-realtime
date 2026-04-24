import { SlpStreamMode } from "@slippi/slippi-js/node";
import type { Subscription } from "rxjs";
import * as sinon from "sinon";

import { ComboFilter, RxSlpStream, SlpRealTime, throttleInputButtons } from "../src";
import { pipeFileContents } from "./pipeFileContents";

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

  it("correctly finds button combinations", async () => {
    const comboSpy = sinon.spy();

    const slpStream = new RxSlpStream({ suppressErrors: false, mode: SlpStreamMode.MANUAL });
    const realtime = new SlpRealTime();
    realtime.setStream(slpStream);

    const buttonPresses = realtime.input.buttonCombo(["X"], 1);
    subscriptions.push(
      buttonPresses
        .pipe(
          throttleInputButtons(5 * 60), // Wait 5 seconds between combos
        )
        .subscribe(() => {
          comboSpy();
        }),
    );

    await pipeFileContents("slp/button-combination-test.slp", slpStream);

    // We should have exactly 2 combo that matched the criteria
    expect(comboSpy.callCount).toEqual(2);
  });
});
