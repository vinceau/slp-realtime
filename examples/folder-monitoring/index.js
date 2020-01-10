/*
This example script reads live slp files from a folder, automatically
detects combos, and generates a Dolphin-compatible `combos.json` file
when the interrupt signal is detected.
*/

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SlpFolderStream, SlpRealTime, ComboFilter, DolphinComboQueue } = require("@vinceau/slp-realtime");

// TODO: Make sure you set this value!
const slpLiveFolderPath = "C:\\Users\\Vince\\Documents\\FM-v5.9-Slippi-r18-Win\\Slippi";
console.log(`Monitoring ${slpLiveFolderPath} for new SLP files`);

const outputCombosFile = "combos.json";   // The json file to write combos to

const comboQueue = new DolphinComboQueue();  // Tracks the combos to be written

const comboFilter = new ComboFilter();  // Used to find specific combos
comboFilter.updateSettings({
  excludeCPUs: false,    // combos on CPUs are okay
  comboMustKill: false,  // combos don't have to kill
  minComboPercent: 40,   // combos have to do at least 40% damage
});

// Connect to the relay
const stream = new SlpFolderStream();

// Add the combos to the queue whenever we detect them
const realtime = new SlpRealTime();
realtime.setStream(stream);
realtime.on("comboEnd", (combo, settings) => {
  if (comboFilter.isCombo(combo, settings)) {
    console.log("Detected combo!");
    const filename = stream.getCurrentFilename();
    if (filename) {
      comboQueue.addCombo(filename, combo);
    }
  }
});

// Write out combos when we detect an interrupt
process.on("SIGINT", function() {
  comboQueue.writeFile(outputCombosFile).then(() => {
    console.log(`Wrote ${comboQueue.length()} combos to ${outputCombosFile}`);
    stream.stop();
    process.exit();
  }).catch(err => {
    console.error(err);
    process.exit();
  })
});

// Start monitoring the folder for changes
stream.start(slpLiveFolderPath);
