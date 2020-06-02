import {TestScheduler} from "rxjs/testing";
import { from } from "rxjs";
import { InputButtonCombo } from "..";
import { throttleInputButtons } from "./throttleInputButtons";

describe("throttleInputButtons operator", () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual: InputButtonCombo, expected: InputButtonCombo) => {
      // We just want to compare the frame
      expect(actual.frame).toEqual(expected.frame);
    });
  });

  it("should filter the correct button inputs", () => {
    const a: InputButtonCombo = {
      frame: 30,
      playerIndex: 0,
      combo:  ["X"],
      duration: 1,
    };
    const a2: InputButtonCombo = {
      ...a,
      frame: 60,
    };
    const b: InputButtonCombo = {
      ...a,
      frame: 78,
    }
    const b2: InputButtonCombo = {
      ...a,
      frame: 112,
    }
    const c: InputButtonCombo = {
      ...a,
      frame: 113,
    }

    testScheduler.run(({expectObservable}) => {
      // We expect 3 values
      const expectedMarble = "a  b  (c|)";
      const expectedValues = { a, b, c };
      const source$ = from([a, a2, b, b2, c]).pipe(
        throttleInputButtons(35),  // Throttle for 35 frames
      )
      expectObservable(source$).toBe(expectedMarble, expectedValues);
    });
  });
})