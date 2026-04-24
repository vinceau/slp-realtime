/*
This example script reads live slp files from a folder, and writes
the players stock count and percentages to a file.

NOTE: Please don't actually do this for real custom HUDs. Writing to files is
slow and OBS takes a long time to update after file changes. If you actually
want to build a custom HUD for OBS you should use a browser source and send
updates using websockets instead of writing data to a file.

*/

const fs = require("fs");
const path = require("path");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { RxSlpStream, SlpRealTime } = require("@vinceau/slp-realtime");

// TODO: Set this folder!!
const playerInfoFolder = "C:\\Users\\Vince\\Desktop";

// TODO: Make sure you set this value!
const slpLiveFolderPath = "C:\\Users\\Vince\\Documents\\FM-v5.9-Slippi-r18-Win\\Slippi";
console.log(`Monitoring ${slpLiveFolderPath} for new SLP files`);

// Track the current game file and its size
let lastSeenFile = "";
let lastFileSize = 0;

// Create the stream for processing slp data
const stream = new RxSlpStream();

// Set up realtime events
const realtime = new SlpRealTime();
realtime.setStream(stream);

// Set up the handlers
const errHandler = (err) => {
  if (err) {
    console.error(err);
  }
};

const setPlayerStock = (player, stock) => {
  fs.writeFile(path.join(playerInfoFolder, `player${player}Stocks.txt`), stock, errHandler);
};

const setPlayerPercent = (player, percent) => {
  fs.writeFile(path.join(playerInfoFolder, `player${player}Percent.txt`), percent, errHandler);
};

// Subscribe to game start events
realtime.game.start$.subscribe(() => {
  console.log("New game detected!");
});

// Subscribe to percent changes
realtime.stock.percentChange$.subscribe((payload) => {
  const player = payload.playerIndex + 1;
  console.log(`player ${player} percent: ${payload.percent}`);
  setPlayerPercent(player, `${payload.percent.toFixed(0)}%`);
});

// Subscribe to stock count changes
realtime.stock.countChange$.subscribe((payload) => {
  const player = payload.playerIndex + 1;
  console.log(`player ${player} stocks: ${payload.stocksRemaining}`);
  setPlayerStock(player, payload.stocksRemaining.toString());
});

// Reset the text files on game end
realtime.game.end$.subscribe(() => {
  setPlayerStock(1, "");
  setPlayerPercent(1, "");
  setPlayerStock(2, "");
  setPlayerPercent(2, "");
});

// Initialize on startup: ignore any existing files
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
