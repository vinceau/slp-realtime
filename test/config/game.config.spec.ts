
import sinon from "sinon";

import { pipeFileContents } from "../helpers";
import { Subscription } from "rxjs";
import SlpRealTime, { SlpStream, EventManager, EventManagerConfig } from "../../src";

describe("game config", () => {
  let subscriptions: Array<Subscription>;

  beforeAll(() => {
    subscriptions = [];
  });

  afterAll(() => {
    subscriptions.forEach(s => s.unsubscribe());
  });

  it("can filter game start and end events", async () => {
    const gameStartSpy = sinon.spy();
    const threePlayerGameStartSpy = sinon.spy();
    const isTeamsGameStartSpy = sinon.spy();
    const gameEndSpy = sinon.spy();

    const slpStream = new SlpStream({ singleGameMode: true });
    const realtime = new SlpRealTime();
    const eventManager = new EventManager(realtime);
    realtime.setStream(slpStream);

    const config: EventManagerConfig = {
      events: [
        {
          id: "game-start-id",
          type: "game-start",
          filter: {
            numPlayers: 2,
          },
        },
        {
          id: "game-end-id",
          type: "game-end",
        },
        {
          id: "3p-game-start-id",
          type: "game-start",
          filter: {
            numPlayers: 3,
          },
        },
        {
          id: "is-teams-game-start-id",
          type: "game-start",
          filter: {
            isTeams: true,
          },
        },
      ]
    };

    subscriptions.push(
      eventManager.events$.subscribe(event => {
        switch (event.id) {
        case "game-start-id":
          gameStartSpy();
          expect(event.payload.numPlayers).toEqual(2);
          break;
        case "game-end-id":
          gameEndSpy();
          break;
        case "3p-game-start-id":
          threePlayerGameStartSpy();
          break;
        case "is-teams-game-start-id":
          isTeamsGameStartSpy();
          break;
        }
      }),
    );

    eventManager.updateConfig(config);

    await pipeFileContents("slp/Game_20190810T162904.slp", slpStream);

    expect(gameStartSpy.callCount).toEqual(1);
    expect(gameEndSpy.callCount).toEqual(1);
    expect(threePlayerGameStartSpy.callCount).toEqual(0);
    expect(isTeamsGameStartSpy.callCount).toEqual(0);
  });

});
