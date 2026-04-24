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

const stream = new RxSlpStream();
const realtime = new SlpRealTime();
realtime.setStream(stream);

const comboFilter = new ComboFilter();
comboFilter.updateSettings({
  excludeCPUs: false,
  comboMustKill: false,
  minComboPercent: 40,
});

realtime.game.start$.subscribe(() => {
  console.log("New game detected!");
});

realtime.combo.end$.subscribe((payload) => {
  const { combo, settings } = payload;
  if (comboFilter.isCombo(combo, settings)) {
    console.log("Combo detected:", combo);
  }
});

function pollFolder() {
  const files = fs
    .readdirSync(slpLiveFolderPath)
    .filter((f) => f.endsWith(".slp"))
    .sort()
    .reverse();

  if (files.length === 0) return;

  const latestFile = files[0];
  const filePath = path.join(slpLiveFolderPath, latestFile);

  if (latestFile !== lastSeenFile) {
    stream.restart();
    lastSeenFile = latestFile;
    console.log(`Processing game: ${latestFile}`);
  }

  const data = fs.readFileSync(filePath);
  stream.process(new Uint8Array(data));
}

setInterval(pollFolder, 500);

process.on("SIGINT", function () {
  console.log("\nStopping...");
  process.exit();
});
