import { pipeFileContents, SlpRealTime, ManualSlpStream } from "../src";
import { Subscription } from "rxjs";

describe("when determining the winner", () => {
  let subscriptions: Array<Subscription>;

  beforeAll(() => {
    subscriptions = [];
  });

  afterAll(() => {
    subscriptions.forEach((s) => s.unsubscribe());
  });

  it("correctly determines winner", async () => {
    let winner = -1;

    const slpStream = new ManualSlpStream();
    const realtime = new SlpRealTime();
    realtime.setStream(slpStream);

    subscriptions.push(
      realtime.game.end$.subscribe((end) => {
        winner = end.winnerPlayerIndex;
      }),
    );

    // Player 4 is the winner
    await slpStream.pipeFile("slp/Game_20190810T162904.slp");
    expect(winner).toEqual(3);

    winner = -1; // Reset the winner

    // Player 2 is the winner
    await slpStream.pipeFile("slp/Game_20190517T164215.slp");
    expect(winner).toEqual(1);

    winner = -1; // Reset the winner

    // Player 1 is the winner
    await slpStream.pipeFile("slp/Game_20190324T113942.slp");
    expect(winner).toEqual(0);

    winner = -1; // Reset the winner

    // Player 2 is the winner
    await slpStream.pipeFile("slp/200306_2258_Falco_v_Fox_PS.slp");
    expect(winner).toEqual(1);
  });
});
