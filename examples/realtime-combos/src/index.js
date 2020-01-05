const { ConnectionStatus, SlippiLivestream, ComboFilter, DolphinComboQueue } = require("@vinceau/slp-realtime");

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
const livestream = new SlippiLivestream({
  outputFiles: true,
});
livestream.start(ADDRESS, PORT)
  .then(() => {
    console.log("Connected to Slippi Relay");
  })
  .catch(console.error);

// Write out the files when disconnected
livestream.connection.on("statusChange", (status) => {
  if (status === ConnectionStatus.DISCONNECTED) {
    // We got disconnected from the relayer
    console.log("Disconnected from the relay.");
    // Write out the combos
    console.log("Writing combo files...");
    comboQueue.writeFile(outputCombosFile);
    console.log(`Wrote ${comboQueue.length()} combos to ${outputCombosFile}`);
  }
});

livestream.events.on("comboEnd", (combo, settings) => {
  if (comboFilter.isCombo(combo, settings)) {
    const filename = livestream.getCurrentFilename();
    if (!filename) {
      console.log("Could not find current slp filename");
    }
    comboQueue.addCombo(filename, combo);
  }
});

