# SLP Folder Monitoring Example

This is an example demonstrating the real-time capabilities of `slp-realtime` and its ability
to read events from open SLP files that are still being written to.

This script polls a specific folder for new SLP files and logs detected combos to the console when they occur.

## How to use

1. Clone the repo, install the dependencies, and build the library to be used by the example.

```bash
git clone https://github.com/vinceau/slp-realtime
cd slp-realtime
npm install
npm run build
```

2. Prepare the example by changing directory into the example folder and installing the dependencies.

```bash
cd examples/folder-monitoring
npm install
```

3. Set the SLP folder location

Open up the `index.js` file in your favourite editor, and modify the value for `slpLiveFolderPath` appropriately.
This should be the folder that Slippi Dolphin writes new SLP files to.

4. Run the actual code

```bash
node index.js
```

## How it works

- The script uses a polling approach to check for new SLP files every 500ms
- When a new game file is detected (new filename), it restarts the stream
- The `RxSlpStream` processes the raw SLP file data via `.process()`
- `SlpRealTime` emits events for combos, stocks, inputs, and game state changes
- Detected combos are logged to the console (customize the action as needed)
