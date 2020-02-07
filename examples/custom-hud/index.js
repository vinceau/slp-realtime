/*
This example script reads live slp files from a folder, and writes
the players stock count and percentages to a file.
*/

const { SlpFolderStream, SlpRealTime } = require("@vinceau/slp-realtime");
const WebSocket = require("ws");

// TODO: Make sure you set this value!
const slpLiveFolderPath = "C:\\Users\\Vince\\Documents\\FM-v5.9-Slippi-r18-Win\\Slippi";
console.log(`Monitoring ${slpLiveFolderPath} for new SLP files`);

// Set up the websocket
const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", () => {
  // ws.send("something");
  console.log("Client connected!");
});

const sendUpdate = (data) => {
  wss.clients.forEach((client) => {
    // const data = `hello world ${counter}!`;
    if (client !== wss && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

// Set up the handlers
const setPlayerStock = (player, stock) => {
  sendUpdate({
    player,
    event: "stock",
    payload: stock,
  });
  // fs.writeFile(path.join(playerInfoFolder, `player${player}Stocks.txt`), stock, errHandler);
}

const setPlayerPercent = (player, percent) => {
  sendUpdate({
    player,
    event: "percent",
    payload: percent,
  });
  // fs.writeFile(path.join(playerInfoFolder, `player${player}Percent.txt`), percent, errHandler);
}

// Connect to the relay
const stream = new SlpFolderStream();
const realtime = new SlpRealTime();
realtime.setStream(stream);
realtime.game.start$.subscribe(() => {
  console.log(`Detected a new game in ${stream.getCurrentFilename()}`);
});
realtime.stock.percentChange$.subscribe((payload) => {
  const player = payload.playerIndex + 1;
  console.log(`player ${player} percent: ${payload.percent}`);
  setPlayerPercent(player, `${Math.floor(payload.percent)}%`);
});

realtime.stock.countChange$.subscribe((payload) => {
  const player = payload.playerIndex + 1;
  console.log(`player ${player} stocks: ${payload.stocksRemaining}`);
  setPlayerStock(player, payload.stocksRemaining);
});

// Reset the text files on game end
realtime.game.end$.subscribe(() => {
  setPlayerStock(1, "");
  setPlayerStock(1, "");
  setPlayerPercent(2, "");
  setPlayerPercent(2, "");
});

// Start monitoring the folder for changes
stream.start(slpLiveFolderPath);
