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

// Track the current game file and its size
let lastSeenFile = "";
let lastFileSize = 0;

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

// Initialize on startup: ignore any existing files, find the latest file but don't process it yet
function init() {
  const files = fs
    .readdirSync(slpLiveFolderPath)
    .filter((f) => f.endsWith(".slp"))
    .sort()
    .reverse();

  if (files.length === 0) return;

  // Set the latest file but don't process - ignore existing files
  lastSeenFile = files[0];
  const filePath = path.join(slpLiveFolderPath, lastSeenFile);
  const stats = fs.statSync(filePath);
  lastFileSize = stats.size;
  console.log(`Watching for new files. Current: ${lastSeenFile} (${lastFileSize} bytes)`);
}

// Poll the folder for new SLP file data every 500ms
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
  const stats = fs.statSync(filePath);
  const currentSize = stats.size;

  // If we have a new file, restart the stream to process a new game
  if (latestFile !== lastSeenFile) {
    stream.restart();
    lastSeenFile = latestFile;
    lastFileSize = currentSize;
    console.log(`Processing new game: ${latestFile}`);
    return; // Wait for next poll cycle to process data
  }

  // If the file has grown, process only the new bytes
  if (currentSize > lastFileSize) {
    const fd = fs.openSync(filePath, "r");
    const newBytes = currentSize - lastFileSize;
    const buffer = Buffer.alloc(newBytes);
    fs.readSync(fd, buffer, 0, newBytes, lastFileSize);
    fs.closeSync(fd);

    // Update the size first to avoid reprocessing if poll happens too quickly
    lastFileSize = currentSize;

    // Process only the new bytes
    stream.process(new Uint8Array(buffer));
  }
}

// Initialize on startup
init();

// Start polling
setInterval(pollFolder, 500);

// Handle graceful shutdown
process.on("SIGINT", function () {
  console.log("\nStopping...");
  process.exit();
});
