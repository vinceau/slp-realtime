/*
This example script connects to a relay, automatically detects combos,
and generates a Dolphin-compatible `combos.json` file when disconnected
from the relay.
*/

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ConnectionStatus, SlpLiveStream, SlpRealTime, ComboFilter, DolphinComboQueue } = require("@vinceau/slp-realtime");

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
  outputFiles: true,  // Write out slp files so we can reference them in the dolphin json file
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
realtime.combo.end$.subscribe(payload => {
  const { combo, settings } = payload;
  if (comboFilter.isCombo(combo, settings)) {
    console.log("Detected combo!");
    const filename = livestream.getCurrentFilename();
    if (filename) {
      comboQueue.addCombo(filename, combo);
    }
  }
});
