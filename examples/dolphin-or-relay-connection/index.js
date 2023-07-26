/*
This example script connects to a relay or instance of Dolphin, automatically
 detects combos, and generates a Dolphin-compatible `combos.json` file 
 when disconnected.
*/

const fs = require("fs");
const { tap, map, filter } = require("rxjs/operators");
const { Ports } = require('@slippi/slippi-js')

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ConnectionStatus, SlpLiveStream, SlpRealTime, ComboFilter, generateDolphinQueuePayload } = require("@vinceau/slp-realtime");

// TODO: Make sure you set these values!
const ADDRESS = "127.0.0.1";  // leave as is for Dolphin or change to "localhost" for a relay on the same computer
const PORT = Ports.DEFAULT;   // options are DEFAULT, RELAY_START, and LEGACY

const outputCombosFile = "combos.json";   // The json file to write combos to

const comboQueue = [];  // Tracks the combos to be written

const comboFilter = new ComboFilter();  // Used to find specific combos
comboFilter.updateSettings({
  excludeCPUs: false,    // combos on CPUs are okay
  comboMustKill: false,  // combos don't have to kill
  minComboPercent: 40,   // combos have to do at least 40% damage
});

// Connect to Dolphin or the relay
const connectionType = "dolphin"; // Change this to "console" if connecting to a relay or Nintendont
const livestream = new SlpLiveStream(connectionType, {
  outputFiles: true,  // Write out slp files so we can reference them in the dolphin json file
});

// connect to the livestream
livestream.start(ADDRESS, PORT)
  .then(() => {
    console.log("Connected to Slippi");
  })
  .catch(console.error);

// Write out the files when we've been disconnected
livestream.connection.on("statusChange", (status) => {
  if (status === ConnectionStatus.DISCONNECTED) {
    console.log("Disconnected from the relay.");
    console.log("Writing combo files...");
    const payload = generateDolphinQueuePayload(comboQueue);
    fs.writeFileSync(outputCombosFile, payload);
    console.log(`Wrote ${comboQueue.length} combos to ${outputCombosFile}`);
  }
});

// Add the combos to the queue whenever we detect them
const realtime = new SlpRealTime();
realtime.setStream(livestream);

// We can choose exactly which events we want to subscribe for
// by using the pipe command. Learn more by reading the RxJS docs.
realtime.combo.end$.pipe(
  // We only want the events which combos match the comboFilter requirements
  filter(payload => comboFilter.isCombo(payload.combo, payload.settings)),
  tap(() => {
    // Tap lets us run side-effects without affecting the event chain
    // Probably best not to use them too much though.
    console.log("Detected combo!");
  }),
  // We only want the combo and the filename
  map(payload => ({
    path: livestream.getCurrentFilename(),
    combo: payload.combo,
  })),
  // The path can be null so make sure it's not null
  filter(comboEntry => Boolean(comboEntry.path)),
).subscribe(comboEntry => {
  // If all the above is valid, we can simply push the data onto the queue
  // whenever an event matches such criteria.
  comboQueue.push(comboEntry);
});


// You can do the same subscription above without using RxJS.
// Doing so would make the subcription look something like this:

// realtime.combo.end$.subscribe(payload => {
//   if (comboFilter.isCombo(payload.combo, payload.settings)) {
//     console.log("Detected combo!");
//     const filename = livestream.getCurrentFilename();
//     if (filename) {
//       comboQueue.push({path: filename, combo: payload.combo});
//     }
//   }
// });
