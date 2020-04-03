import os from "os";
import sinon from "sinon";

import { Transform } from "stream";
import { Subscription } from "rxjs";
import { observableDolphinProcess } from "./playback";

describe("when reading dolphin playback stdout", () => {
  const subscription = new Subscription();

  afterAll(() => {
    subscription.unsubscribe();
  });

  it("can parse command messages", async (finishJest) => {
    const inoutStream = new Transform();
    inoutStream.once("finish", finishJest);

    const spy = sinon.spy();

    const dolphin$ = observableDolphinProcess(inoutStream);
    subscription.add(
      dolphin$.subscribe(() => {
        // console.log(data);
        spy();
      })
    );

    const payloadToWrite = [
      "[PLAYBACK_START_FRAME] 0",
      "[GAME_END_FRAME] 1",
      "[PLAYBACK_END_FRAME] 2",
      "[CURRENT_FRAME] 3",
      "[NO_GAME] 4",
    ].join(os.EOL);
    inoutStream.push(payloadToWrite);
    inoutStream.end();

    expect(spy.callCount).toEqual(5);
  });

});
