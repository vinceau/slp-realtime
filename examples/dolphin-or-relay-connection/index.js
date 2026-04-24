/*
This example script connects to Dolphin or a relay,
automatically detects combos, and logs them to the console.
*/

const { tap, filter } = require("rxjs/operators");
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

// Connect to Dolphin
const connection = new DolphinConnection();

// Pipe the raw message data to the stream for processing
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
    console.log("Disconnected from Slippi.");
  }
});

// connect to Dolphin
connection
  .connect(ADDRESS, PORT)
  .then(() => {
    console.log("Connected to Slippi");
  })
  .catch(console.error);

// We can choose exactly which events we want to subscribe for
// by using the pipe command. Learn more by reading the RxJS docs.
realtime.combo.end$
  .pipe(
    // We only want the events which combos match the comboFilter requirements
    filter((payload) => comboFilter.isCombo(payload.combo, payload.settings)),
    tap(() => {
      // Tap lets us run side-effects without affecting the event chain
      // Probably best not to use them too much though.
      console.log("Detected combo!");
    }),
  )
  .subscribe((payload) => {
    // Log the combo to the console
    console.log("Combo detected:", payload.combo);
  });

// You can do the same subscription above without using RxJS.
// Doing so would make the subscription look something like this:

// realtime.combo.end$.subscribe(payload => {
//   if (comboFilter.isCombo(payload.combo, payload.settings)) {
//     console.log("Detected combo!");
//   }
// });

// Handle graceful shutdown
process.on("SIGINT", function () {
  console.log("\nDisconnecting...");
  connection.disconnect();
  process.exit();
});
