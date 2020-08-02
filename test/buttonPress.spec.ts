import sinon from "sinon";

import { pipeFileContents, SlpRealTime, RxSlpStream, ComboFilter, throttleInputButtons } from "../src";
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

  it("correctly finds button combinations", async () => {
    const comboSpy = sinon.spy();

    const slpStream = new RxSlpStream();
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
