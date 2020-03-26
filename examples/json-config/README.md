# JSON Config API Example

This is an example demonstrating the JSON Config API of `slp-realtime`.

This script connects to a Slippi relay and subscribes to different events, logging to the console whenever the event occurs as well as the attached payload.

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
cd examples/json-config
yarn install
```

3. Set the address and port

Open up the `index.js` file in your favourite editor, and modify the values for `ADDRESS` and `PORT` appropriately.

4. Run the actual code

```bash
node index.js
```
