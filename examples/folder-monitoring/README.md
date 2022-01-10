**NOTE: The connection method used in this example, `SlpFolderStream`, is largely deprecated in favor of using `SlpLiveStream` with the `"dolphin"` connection type. See [here](../dolphin-or-relay-connection) for details.**

# SLP Folder Monitoring Example

This is an example demonstrating the real-time capabilities of `slp-realtime` and its ability
to read events from open SLP files that are still be written to.

This script reads events from a specific folder which has new SLP files being written to
and generates a Dolphin-compatible `combos.json` file when disconnected the interrupt signal
is given.


## How to use

1. Clone the repo, install the dependencies, and build the library to be used by the example.

```bash
git clone https://github.com/vinceau/slp-realtime
cd slp-realtime
yarn install
yarn run build
```

2. Prepare the example by changing directory into the example folder and installing the dependencies. 

```bash
cd examples/folder-monitoring
yarn install
```

3. Set the SLP folder folder location

Open up the `index.js` file in your favourite editor, and modify the value for `slpLiveFolderPath` appropriately.
This should be the folder that Slippi Dolphin writes new SLP files to.

4. Run the actual code

```bash
node index.js
```
