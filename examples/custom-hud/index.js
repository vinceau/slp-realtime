/* eslint-disable @typescript-eslint/no-var-requires */
/*
This example script reads live slp files from a folder, and writes
the players stock count and percentages to a file.
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

const errHandler = (err) => {
  if (err) {
    console.error(err);
  }
}

// Add the combos to the queue whenever we detect them
const realtime = new SlpRealTime();
realtime.setStream(stream);
realtime.game.start$.subscribe(() => {
  console.log(`Detected a new game in ${stream.getCurrentFilename()}`);
});
realtime.stock.percentChange$.subscribe((payload) => {
  console.log(`player ${payload.playerIndex + 1} percent: ${payload.percent}`);
  fs.writeFile(path.join(playerInfoFolder, `player${payload.playerIndex + 1}Percent.txt`), `${Math.floor(payload.percent)}%`, errHandler);
});

realtime.stock.countChange$.subscribe((payload) => {
  console.log(`player ${payload.playerIndex + 1} stocks: ${payload.stocksRemaining}`);
  fs.writeFile(path.join(playerInfoFolder, `player${payload.playerIndex + 1}Stocks.txt`), payload.stocksRemaining, errHandler);
});

// Reset the text files on game end
realtime.game.end$.subscribe(() => {
  fs.writeFile(path.join(playerInfoFolder, `player1Stocks.txt`), "", errHandler);
  fs.writeFile(path.join(playerInfoFolder, `player2Stocks.txt`), "", errHandler);
  fs.writeFile(path.join(playerInfoFolder, `player1Percent.txt`), "", errHandler);
  fs.writeFile(path.join(playerInfoFolder, `player2Percent.txt`), "", errHandler);
});

// Start monitoring the folder for changes
stream.start(slpLiveFolderPath);
