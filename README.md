
# `slp-realtime`

[![npm version](https://img.shields.io/npm/v/@vinceau/slp-realtime.svg?style=flat)](https://npmjs.org/package/@vinceau/slp-realtime "View this project on npm")
[![Build Status](https://github.com/vinceau/slp-realtime/workflows/build/badge.svg)](https://github.com/vinceau/slp-realtime/actions?workflow=build)
[![Coverage Status](https://coveralls.io/repos/github/vinceau/slp-realtime/badge.svg?branch=feat/coverage)](https://coveralls.io/github/vinceau/slp-realtime?branch=feat/coverage)
[![License](https://img.shields.io/npm/l/@vinceau/slp-realtime)](https://github.com/vinceau/slp-realtime/blob/master/LICENSE)

> The brains *and* the brawn of [Project Clippi](https://github.com/vinceau/project-clippi).

This library provides an easy way to subscribe to real-time [Slippi](https://github.com/project-slippi/project-slippi) game events as they happen. Rebuilt from the ground up using [RxJS Observables](https://rxjs-dev.firebaseapp.com/guide/overview), the power to subscribe to any and every event is in your hands.


## Highlights

* Go file-less. Read directly from the relay or console.
* Custom combos. Easily add combo parameters and output Dolphin-compatible JSON files.
* Powerful RxJS Observable and Stream API.

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

See a [working example](examples) or [check out the docs](https://vince.id.au/slp-realtime/).

### Subscribing to In-Game Events

We can use this library to subscribe to in game events.

First instantiate an instance of `SlpLiveStream` and connect to a Wii or Slippi relay.

```javascript
const { SlpLiveStream } = require("@vinceau/slp-realtime");

const livestream = new SlpLiveStream();
livestream.start(address, slpPort)
  .then(() => {
    console.log("Successfully connected!");
  })
  .catch(console.error);
```

Then instantiate an instance of `SlpRealTime` and pass the `SlpLiveStream` to it.
We will use it to subscribe to desired events. For example:

```javascript
const { SlpRealTime } = require("@vinceau/slp-realtime");

const realtime = new SlpRealTime();
// Read from the SlpLiveStream object from before
realtime.setStream(livestream);

realtime.game.start$.subscribe(() => {
    console.log("game started");
});

realtime.stock.percentChange$.subscribe(payload => {
    // Player index is zero-indexed
    const { playerIndex, percent } = payload;
    console.log(`player ${playerIndex + 1}'s new percent: ${percent}`);
});

realtime.stock.playerSpawn$.subscribe(stock => {
    const { playerIndex, count } = stock;
    console.log(`player ${playerIndex + 1} spawned with ${count} stocks remaining`);
});

realtime.stock.playerDied$.subscribe(stock => {
    const { playerIndex } = stock;
    console.log(`player ${playerIndex + 1} died`);
});

realtime.combo.end$.subscribe(() => {
    console.log("wombo combooo!!");
});
```

### Detecting Custom Combos

We can subscribe to the end of any and every combo but really what we want is to filter for specific combos.

First, instantiate a `ComboFilter`. For all the possible filtering options, see [ComboFilterSettings](api/README.md#combofiltersettings).

```javascript
const { ComboFilter } = require("@vinceau/slp-realtime");

const comboFilter = new ComboFilter();
comboFilter.updateSettings({
    excludeCPUs: false,    // combos on CPUs are okay
    comboMustKill: false,  // combos don't have to kill
    minComboPercent: 40,   // combos have to do at least 40% damage
});
```

`ComboFilter` has an `isCombo()` method which returns `true` if a given combo matches the specified criteria. We can hook it up to our live stream with the following:

```javascript
realtime.combo.end$.subscribe(payload => {
    const { combo, settings } = payload;
    if (comboFilter.isCombo(combo, settings)) {
        console.log("Combo matched!");
    }
});
```

### Make a Custom HUD

Want to make your own HUD?

1. Subscribe to percent and stock changes
2. Write the data to a file
3. Add files to OBS
4. [???](examples/custom-hud)
5. Profit!!

```javascript
realtime.stock.percentChange$.subscribe(payload => {
  const player = payload.playerIndex + 1;
  console.log(`player ${player} percent: ${payload.percent}`);
  fs.writeFileSync(`./player${player}Percent.txt`), payload.percent);
});

realtime.stock.countChange$.subscribe((payload) => {
  const player = payload.playerIndex + 1;
  console.log(`player ${player} stocks: ${payload.stocksRemaining}`);
  fs.writeFileSync(`./player${player}Stocks.txt`), payload.stocksRemaining);
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

* [NikhilNarayana](https://github.com/NikhilNarayana) and his [Get Slippi Combos](https://gist.github.com/NikhilNarayana/d45e328e9ea47127634f2faf575e8dcf) script


## License

This software is released under the terms of [MIT license](LICENSE).

Linking back to [this Github repo](https://github.com/vinceau/slp-realtime) is much appreciated.
