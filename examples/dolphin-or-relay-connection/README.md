# Dolphin / Relay Connection Example

This is an example demonstrating the real-time capabilities of `slp-realtime`.

This script connects to a Dolphin instance or Slippi relay and logs detected combos to the console.

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
cd examples/dolphin-or-relay-connection
npm install
```

3. Set the address and port

Open up the `index.js` file in your favourite editor, and modify the values for `ADDRESS` and `PORT` appropriately.

4. Run the actual code

```bash
node index.js
```

## How it works

- Uses `DolphinConnection` from `@slippi/slippi-js` to connect to Dolphin directly
- For Console/Relay instead, swap `DolphinConnection` with `ConsoleConnection`
- The connection emits raw message data which is piped to the `RxSlpStream` via `.process()`
- `SlpRealTime` emits events for combos, stocks, inputs, and game state changes
- Detected combos are logged to the console (customize the action as needed)
