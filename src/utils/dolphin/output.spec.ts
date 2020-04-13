import os from "os";
import sinon from "sinon";

import { Transform } from "stream";
import { Subscription } from "rxjs";
import { DolphinOutput } from "./output";

describe("when reading dolphin playback stdout", () => {
  const subscription = new Subscription();

  afterAll(() => {
    subscription.unsubscribe();
  });

  it("can parse command messages", async (finishJest) => {
    const inoutStream = new Transform();
    const filepath = "C:/abc/def";
    const payloadToWrite = [
      `[FILE_PATH] ${filepath}`,
      "[PLAYBACK_START_FRAME] 0",
      "[GAME_END_FRAME] 4",
      "[PLAYBACK_END_FRAME] 3",
      "[CURRENT_FRAME] 0",
      "[CURRENT_FRAME] 1",
      "[CURRENT_FRAME] 2",
      "[CURRENT_FRAME] 3",
      "[NO_GAME]",
    ].join(os.EOL);

    const statusSpy = sinon.spy();
    const filenameSpy = sinon.spy();
    const dolphinOutput = new DolphinOutput();
    subscription.add(
      dolphinOutput.playbackFilename$.subscribe(name => {
        expect(name).toEqual(filepath);
        filenameSpy();
      }),
    );
    subscription.add(
      dolphinOutput.playbackStatus$.subscribe(payload => {
        statusSpy();
      }),
    );

    inoutStream.once("finish", () => {
        expect(filenameSpy.callCount).toEqual(1);
        expect(statusSpy.callCount).toEqual(4);
        finishJest();
    });

    inoutStream.push(payloadToWrite);
    inoutStream.pipe(dolphinOutput);
    inoutStream.end();

  });

});
