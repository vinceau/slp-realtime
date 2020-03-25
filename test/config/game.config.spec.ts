
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

  it("can can match game end winner", async () => {
    const playerWinSpy = sinon.spy();
    const player2WinSpy = sinon.spy();
    const player4WinSpy = sinon.spy();

    const slpStream = new SlpStream({ singleGameMode: false });
    const realtime = new SlpRealTime();
    const eventManager = new EventManager(realtime);
    realtime.setStream(slpStream);

    const config: EventManagerConfig = {
      variables: {
        playerIndex: 0,  // Let's pretend that we're player 1
      },
      events: [
        {
          id: "player-won-id",
          type: "game-end",
          filter: {
            winnerPlayerIndex: "player",  // Track which games "we" won
          },
        },
        {
          id: "player-2-won-id",
          type: "game-end",
          filter: {
            winnerPlayerIndex: 1,
          },
        },
        {
          id: "player-4-won-id",
          type: "game-end",
          filter: {
            winnerPlayerIndex: 3,
          },
        },
      ]
    };

    subscriptions.push(
      eventManager.events$.subscribe(event => {
        switch (event.id) {
        case "player-won-id":
          playerWinSpy();
          break;
        case "player-2-won-id":
          player2WinSpy();
          break;
        case "player-4-won-id":
          player4WinSpy();
          break;
        }
      }),
    );

    eventManager.updateConfig(config);

    await pipeFileContents("slp/Game_20190810T162904.slp", slpStream, { end: false });
    await pipeFileContents("slp/Game_20190517T164215.slp", slpStream, { end: false });
    await pipeFileContents("slp/Game_20190324T113942.slp", slpStream, { end: false });
    await pipeFileContents("slp/200306_2258_Falco_v_Fox_PS.slp", slpStream, { end: true });

    expect(playerWinSpy.callCount).toEqual(1);
    expect(player2WinSpy.callCount).toEqual(2);
    expect(player4WinSpy.callCount).toEqual(1);
  });

});
