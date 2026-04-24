/*
This example script connects to Dolphin or a relay,
automatically detects combos, and logs them to the console.
*/

const { Ports } = require("@slippi/slippi-js/node");
const { DolphinConnection } = require("@slippi/slippi-js/node");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { RxSlpStream, SlpRealTime, ComboFilter } = require("@vinceau/slp-realtime");

// TODO: Make sure you set these values!
const ADDRESS = "127.0.0.1"; // leave as is for Dolphin
const PORT = Ports.DEFAULT; // options are DEFAULT, RELAY_START, and LEGACY

// For Console/Relay connection instead, use:
// const { ConsoleConnection } = require("@slippi/slippi-js/node");
// const connection = new ConsoleConnection();

const stream = new RxSlpStream();
const realtime = new SlpRealTime();
realtime.setStream(stream);

const comboFilter = new ComboFilter();
comboFilter.updateSettings({
  excludeCPUs: false,
  comboMustKill: false,
  minComboPercent: 40,
});

const connection = new DolphinConnection();
connection.on("message", (data) => {
  stream.process(data);
});

connection.on("connect", () => {
  console.log("Connected to Slippi");
});

connection.on("statusChange", (status) => {
  console.log("Status changed:", status);
  if (status === 0) {
    // DISCONNECTED
    console.log("Disconnected from Slippi");
  }
});

connection.connect(ADDRESS, PORT).catch(console.error);

realtime.combo.end$.subscribe((payload) => {
  const { combo, settings } = payload;
  if (comboFilter.isCombo(combo, settings)) {
    console.log("Combo detected:", combo);
  }
});

process.on("SIGINT", function () {
  console.log("\nDisconnecting...");
  connection.disconnect();
  process.exit();
});
