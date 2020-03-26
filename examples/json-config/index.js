/*
This example script demonstrates the JSON Config API.
It subscribes to some different events and logs to the console
whenever the event occurs along with the attached payload.
*/

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SlpLiveStream, SlpRealTime, EventManager } = require("@vinceau/slp-realtime");

// TODO: Make sure you set these values!
const ADDRESS = "localhost";  // leave as is if the relay is on the same computer
const PORT = 1667;            // relay port

// Connect to the relay
const livestream = new SlpLiveStream();

// connect to the livestream
livestream.start(ADDRESS, PORT)
  .then(() => {
    console.log("Connected to Slippi Relay");
  })
  .catch(console.error);

// Add the combos to the queue whenever we detect them
const realtime = new SlpRealTime();
realtime.setStream(livestream);

const eventManager = new EventManager(realtime);
const config = {
  events: [
    {
      id: "event-1-game-start",
      type: "game-start",
    },
    {
      id: "event-2-player-1-combo",
      type: "combo-end",
      filter: {
        playerIndex: 0,  // Index 0 means player 1
        minComboPercent: 40,
        excludeCPUs: false,
        excludeChainGrabs: false,
        comboMustKill: false,
      },
    },
    {
      id: "event-3-player-4-button-press",
      type: "button-combo",
      filter: {
        playerIndex: 3, // Index 3 means player 4
        combo: ["A", "B"],
        duration: 120, // 60 fps * 2 seconds
      },
    },
  ]
};

// Tell the event manager to use our config
eventManager.updateConfig(config);

eventManager.events$.subscribe(event => {
  switch (event.id) {
    case "event-1-game-start":
      console.log("A new game is starting!");
      break;
    case "event-2-player-1-combo":
      console.log("Player 1 did a combo!");
      break;
    case "event-3-player-4-button-press":
      console.log("Player 4 held A+B for 2 seconds!");
      break;
  }
  // Also log the event payload
  console.log(event.payload);
});
