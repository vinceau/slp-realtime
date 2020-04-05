/*
This example script reads live slp files from a folder, automatically
detects combos, and generates a Dolphin-compatible `combos.json` file
when the interrupt signal is detected.
*/

const fs = require("fs");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SlpFolderStream, SlpRealTime, ComboFilter, generateDolphinQueuePayload } = require("@vinceau/slp-realtime");

// TODO: Make sure you set this value!
const slpLiveFolderPath = "C:\\Users\\Vince\\Documents\\FM-v5.9-Slippi-r18-Win\\Slippi";
console.log(`Monitoring ${slpLiveFolderPath} for new SLP files`);

const outputCombosFile = "combos.json";   // The json file to write combos to

const comboQueue = [];  // Tracks the combos to be written

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
realtime.game.start$.subscribe(() => {
  console.log(`Detected a new game in ${stream.getCurrentFilename()}`);
});
realtime.combo.end$.subscribe((payload) => {
  const { combo, settings } = payload;
  if (comboFilter.isCombo(combo, settings)) {
    console.log("Detected combo!");
    const filename = stream.getCurrentFilename();
    if (filename) {
      comboQueue.push({path: filename, combo});
    }
  }
});

// Write out combos when we detect an interrupt
process.on("SIGINT", function() {
  const payload = generateDolphinQueuePayload(comboQueue);
  fs.writeFileSync(outputCombosFile, payload);
  console.log(`Wrote ${comboQueue.length} combos to ${outputCombosFile}`);
  stream.stop();
  process.exit();
});

// Start monitoring the folder for changes
stream.start(slpLiveFolderPath);
