import { TestScheduler } from "rxjs/testing";
import { from } from "rxjs";
import { debounceFrame } from "./frames";
import { tap } from "rxjs/operators";

interface TestFrame {
  frame: number;
  data: string;
}

describe("frame operators", () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual: TestFrame, expected: TestFrame) => {
      expect(actual).toEqual(expected);
    });
  });

  it("can debounce multiple frames", () => {
    const a: TestFrame = {
      frame: 1,
      data: "a",
    };
    const a2: TestFrame = {
      frame: 1,
      data: "b",
    };
    const b: TestFrame = {
      frame: 2,
      data: "a",
    };
    const b2: TestFrame = {
      frame: 2,
      data: "b",
    };
    const c: TestFrame = {
      frame: 3,
      data: "a",
    };

    testScheduler.run(({ expectObservable }) => {
      // We expect 3 values
      const expectedMarble = "(abc|)";
      const expectedValues = { a: a2, b: b2, c };
      const source$ = from([a, a2, b, b2, c]).pipe(
        debounceFrame(250), // Debounce if we get multiple of the same frame
        tap((x) => console.log(JSON.stringify(x))),
      );
      expectObservable(source$).toBe(expectedMarble, expectedValues);
    });
  });
});
