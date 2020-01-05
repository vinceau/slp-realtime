const { ConnectionStatus, SlippiLivestream, ComboFilter, DolphinComboQueue } = require("@vinceau/slp-realtime");

// TODO: Make sure you set these values!
const ADDRESS = "localhost";  // leave as is if the relay is on the same computer
const PORT = 1667;            // relay port

const outputCombosFile = "combos.js";

let comboQueue;

const livestream = new SlippiLivestream();
livestream.start(ADDRESS, PORT)
  .then(() => {
    console.log("Connected to Slippi Relay");
  })
  .catch(console.error);


livestream.connection.on("statusChange", (status) => {
  if (status === ConnectionStatus.CONNECTED) {
    console.log("Detected status change - Connected");
    // Create a new combo queue
    comboQueue = new DolphinComboQueue();
  } else if (status === ConnectionStatus.DISCONNECTED) {
    // We got disconnected from the relayer
    console.log("Disconnected from the relay.");
    // Write out the combos
    if (comboQueue) {
      console.log("Writing combo files...");
      comboQueue.writeFile(outputCombosFile);
      console.log(`Wrote ${comboQueue.length()} combos to ${outputCombosFile}`);
    }
  }
});

