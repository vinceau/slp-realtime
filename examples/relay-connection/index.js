/*
This example script connects to a relay, automatically detects combos,
and generates a Dolphin-compatible `combos.json` file when disconnected
from the relay.
*/

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ConnectionStatus, SlpLiveStream, SlpRealTime, ComboFilter, DolphinComboQueue } = require("@vinceau/slp-realtime");
const { didLoseStock } = require("slp-parser-js");

// TODO: Make sure you set these values!
const ADDRESS = "localhost";  // leave as is if the relay is on the same computer
const PORT = 1667;            // relay port

const outputCombosFile = "combos.json";   // The json file to write combos to

const comboQueue = new DolphinComboQueue();  // Tracks the combos to be written

const comboFilter = new ComboFilter();  // Used to find specific combos
comboFilter.updateSettings({
  excludeCPUs: false,    // combos on CPUs are okay
  comboMustKill: false,  // combos don't have to kill
  minComboPercent: 40,   // combos have to do at least 40% damage
});

// Connect to the relay
const livestream = new SlpLiveStream({
  outputFiles: false,  // Write out slp files so we can reference them in the dolphin json file
});

// connect to the livestream
livestream.start(ADDRESS, PORT)
  .then(() => {
    console.log("Connected to Slippi Relay");
  })
  .catch(console.error);

// Write out the files when we've been disconnected
livestream.connection.on("statusChange", (status) => {
  if (status === ConnectionStatus.DISCONNECTED) {
    console.log("Disconnected from the relay.");
    console.log("Writing combo files...");
    comboQueue.writeFile(outputCombosFile);
    console.log(`Wrote ${comboQueue.length()} combos to ${outputCombosFile}`);
  }
});

// Add the combos to the queue whenever we detect them
const realtime = new SlpRealTime();
realtime.setStream(livestream);


/*
const {take} = require("rxjs/operators");
livestream.preFrameUpdate$.pipe(take(400)).subscribe((x) => {
  console.log("preframe");
  console.log(x);
});
livestream.postFrameUpdate$.pipe(take(400)).subscribe((x) => {
  console.log("postframe");
  console.log(x);
});
*/


/*
realtime.player$.subscribe(f => {
  console.log("last frame from the game");
  console.log(JSON.stringify(f, 0, 2));
  console.log("did lose stock:");
  console.log(didLoseStock(f[1].players["1"].post, f[0].players["1"].post));
});
*/

realtime.gameWinner$.subscribe(i => {
  console.log(`Winner of the game was: P${i + 1}`);
});

const playerDied$ = realtime.playerDied(1);
playerDied$.subscribe(() => {
  console.log("player died");
});

realtime.on("gameStart", () => {
  console.log("starting game...");
});

const percentChange$ = realtime.playerPercentChange(1);
percentChange$.subscribe((percent) => {
  console.log(`player 2 has percent: ${percent}`);
});

/*
realtime.on("comboEnd", (combo, settings) => {
  if (comboFilter.isCombo(combo, settings)) {
    console.log("Detected combo!");
    const filename = livestream.getCurrentFilename();
    if (filename) {
      comboQueue.addCombo(filename, combo);
    }
  }
});
*/
