# `slp-realtime`

[![Build Status](https://github.com/vinceau/slp-realtime/workflows/build/badge.svg)](https://github.com/vinceau/slp-realtime/actions?workflow=build)

> A real-time Slippi parsing library.

This library provides an easy way to subscribe to real-time [Slippi](https://github.com/project-slippi/project-slippi) game events as they happen.


## Highlights

* Go file-less. Read directly from the relay or console.
* Custom combos. Easily add combo parameters and output Dolphin-compatible JSON files.
* Events, Promise, and Stream API.

## Installation

**With NPM**

```bash
npm install @vinceau/slp-realtime
```

**With Yarn**

```bash
yarn add @vinceau/slp-realtime
```

## Usage

### Subscribing to In-Game Events

You can use this library to subscribe to in game events.

First instantiate an instance of `SlippiLivestream` and connect to a Wii or Slippi relay.

```javascript
const { SlippiLivestream } = require("@vinceau/slp-realtime");

const livestream = new SlippiLivestream();
livestream.start(address, slpPort)
  .then(() => {
    console.log("Successfully connected!");
  })
  .catch(console.error);
```

Then simply use `livestream.events.on()` to subscribe to desired events. For example:

```javascript
livestream.events.on("gameStart", () => {
    console.log("game started");
});

livestream.events.on("percentChange", (index, percent) => {
    console.log(`player ${index}'s new percent: ${percent}`);
});

livestream.events.on("spawn", (index, stock) => {
    console.log(`player ${index} spawned with ${stock.count} stocks remaining`);
});

livestream.events.on("death", (i) => {
    console.log(`player ${i} died`);
});

livestream.events.on("comboEnd", () => {
    console.log("a combo just happened");
});
```

## Development

To build the library from source:

```bash
yarn run build
```

To start the development server:

```bash
yarn run watch
```

To run the tests:

```bash
yarn run test
```

## Acknowledgements

This project was made possible by:

* [Jas Laferriere](https://github.com/JLaferri) and the rest of the [Project Slippi](https://github.com/project-slippi) team

* [NikhilNarayana](https://github.com/NikhilNarayana) and his [GetSlippiCombos](https://gist.github.com/NikhilNarayana/d45e328e9ea47127634f2faf575e8dcf) script


## License

This software is released under the terms of [MIT license](LICENSE).
