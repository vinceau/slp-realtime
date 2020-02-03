/* eslint-disable @typescript-eslint/no-var-requires */
/*
This example script reads live slp files from a folder, automatically
detects combos, and generates a Dolphin-compatible `combos.json` file
when the interrupt signal is detected.
*/

// TODO: Set this folder!!
const playerInfoFolder = "C:\\Users\\Vince\\Desktop";

const { SlpFolderStream, SlpRealTime } = require("@vinceau/slp-realtime");
const fs = require("fs");
const path = require("path");

// TODO: Make sure you set this value!
const slpLiveFolderPath = "C:\\Users\\Vince\\Documents\\FM-v5.9-Slippi-r18-Win\\Slippi";
console.log(`Monitoring ${slpLiveFolderPath} for new SLP files`);

// Connect to the relay
const stream = new SlpFolderStream();

// Add the combos to the queue whenever we detect them
const realtime = new SlpRealTime();
realtime.setStream(stream);
realtime.game.start$.subscribe(() => {
  console.log(`Detected a new game in ${stream.getCurrentFilename()}`);
});
realtime.stock.percentChange$.subscribe((payload) => {
  fs.writeFileSync(path.join(playerInfoFolder, `player${payload.playerIndex}Percent.txt`), payload.percent);
});

realtime.stock.countChange$.subscribe((payload) => {
  fs.writeFileSync(path.join(playerInfoFolder, `player${payload.playerIndex}Stocks.txt`), payload.stocksRemaining);
});

// Start monitoring the folder for changes
stream.start(slpLiveFolderPath);
