/*
This example script reads live slp files from a folder, automatically
detects combos, and logs them to the console when detected.
*/

const fs = require("fs");
const path = require("path");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { RxSlpStream, SlpRealTime, ComboFilter } = require("@vinceau/slp-realtime");

// TODO: Make sure you set this value!
const slpLiveFolderPath = "C:\\Users\\Vince\\Documents\\FM-v5.9-Slippi-r18-Win\\Slippi";
console.log(`Monitoring ${slpLiveFolderPath} for new SLP files`);

let lastSeenFile = ""; // Track filename of active game

// Create the stream used for processing slp data
const stream = new RxSlpStream();

// Set up realtime events
const realtime = new SlpRealTime();
realtime.setStream(stream);

// Used to find specific combos
const comboFilter = new ComboFilter();
comboFilter.updateSettings({
  excludeCPUs: false, // combos on CPUs are okay
  comboMustKill: false, // combos don't have to kill
  minComboPercent: 40, // combos have to do at least 40% damage
});

// Subscribe to game start events
realtime.game.start$.subscribe(() => {
  console.log("New game detected!");
});

// Subscribe to combo events whenever we detect them
realtime.combo.end$.subscribe((payload) => {
  const { combo, settings } = payload;
  if (comboFilter.isCombo(combo, settings)) {
    console.log("Combo detected:", combo);
  }
});

// Poll the folder for new SLP files every 500ms
function pollFolder() {
  // Get list of slp files, sorted by name
  const files = fs
    .readdirSync(slpLiveFolderPath)
    .filter((f) => f.endsWith(".slp"))
    .sort()
    .reverse();

  if (files.length === 0) return;

  const latestFile = files[0];
  const filePath = path.join(slpLiveFolderPath, latestFile);

  // If we have a new file, restart the stream to process a new game
  if (latestFile !== lastSeenFile) {
    stream.restart();
    lastSeenFile = latestFile;
    console.log(`Processing game: ${latestFile}`);
  }

  // Read the file contents and process them
  const data = fs.readFileSync(filePath);
  stream.process(new Uint8Array(data));
}

setInterval(pollFolder, 500);

// Handle graceful shutdown
process.on("SIGINT", function () {
  console.log("\nStopping...");
  process.exit();
});
