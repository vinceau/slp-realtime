# Real-time Combo Extraction Example

This is an example demonstrating the real-time capabilities of `slp-realtime`.

This script connects to a Slippi relay, automatically detects combos,
and generates a Dolphin-compatible `combos.json` file when disconnected
from the relay.

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
cd examples/relay-connection
yarn install
```

3. Set the address and port

Open up the `index.js` file in your favourite editor, and modify the values for `ADDRESS` and `PORT` appropriately.

4. Run the actual code

```bash
node index.js
```
