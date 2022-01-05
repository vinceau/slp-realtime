# `slp-realtime`

[![slp-realtime is magic - Nikki](https://i.imgur.com/qnfI6c5.png)](https://i.imgur.com/qnfI6c5.png)

[![npm version](https://img.shields.io/npm/v/@vinceau/slp-realtime.svg?style=flat)](https://npmjs.org/package/@vinceau/slp-realtime "View this project on npm")
[![Build Status](https://github.com/vinceau/slp-realtime/workflows/build/badge.svg)](https://github.com/vinceau/slp-realtime/actions?workflow=build)
[![Coverage Status](https://coveralls.io/repos/github/vinceau/slp-realtime/badge.svg)](https://coveralls.io/github/vinceau/slp-realtime)
[![License](https://img.shields.io/npm/l/@vinceau/slp-realtime)](https://github.com/vinceau/slp-realtime/blob/master/LICENSE)

> The brains _and_ the brawn of [Project Clippi](https://github.com/vinceau/project-clippi).

This library provides an easy way to subscribe to real-time [Slippi](https://github.com/project-slippi/project-slippi) game events as they happen. Rebuilt from the ground up using [RxJS Observables](https://rxjs-dev.firebaseapp.com/guide/overview), the power to subscribe to any and every event is in your hands.

## Highlights

- Go file-less. Read directly from Slippi Dolphin, the relay, or a console.
- Custom combos. Easily add combo parameters and output Dolphin-compatible JSON files.
- Powerful [RxJS Observable](https://rxjs-dev.firebaseapp.com/guide/overview) and Stream API.

## Installation

This package relies on the `rxjs` and `@slippi/slippi-js` packages as a peer dependency and must be installed alongside this package.

**With NPM**

```bash
npm install @vinceau/slp-realtime rxjs @slippi/slippi-js
```

**With Yarn**

```bash
yarn add @vinceau/slp-realtime rxjs @slippi/slippi-js
```

## Usage

See a [working example](examples) or [check out the docs](api/README.md).

For a list of all the subscribable events, [click here](api/observables.md#events).

The following usage examples use the more complex [RxJS Observable API](api/observables.md). For a more
simplified usage, check out the [JSON Config API](api/json-config.md) and the [accompanying working example](examples/json-config).

### Subscribing to In-Game Events

We can use this library to subscribe to in game events.

First instantiate an instance of `SlpLiveStream` and connect to a Wii or Slippi relay.

```javascript
const { SlpLiveStream } = require("@vinceau/slp-realtime");

const livestream = new SlpLiveStream();
livestream
  .start(address, slpPort)
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

realtime.stock.playerSpawn$.subscribe((stock) => {
  const { playerIndex, count } = stock;
  console.log(`player ${playerIndex + 1} spawned with ${count} stocks remaining`);
});

realtime.combo.end$.subscribe(() => {
  console.log("wombo combooo!!");
});
```

### Detecting Custom Combos

We can subscribe to the end of any and every combo but really what we want is to filter for specific combos.

First, instantiate a `ComboFilter`. For all the possible filtering options, see [ComboFilterSettings](api/types.md#combofiltersettings).

```javascript
const { ComboFilter } = require("@vinceau/slp-realtime");

const comboFilter = new ComboFilter();
comboFilter.updateSettings({
  excludeCPUs: false, // combos on CPUs are okay
  comboMustKill: false, // combos don't have to kill
  minComboPercent: 40, // combos have to do at least 40% damage
});
```

`ComboFilter` has an `isCombo()` method which returns `true` if a given combo matches the specified criteria. We can hook it up to our live stream with the following:

```javascript
realtime.combo.end$.subscribe((payload) => {
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
realtime.stock.percentChange$.subscribe((payload) => {
  const player = payload.playerIndex + 1;
  console.log(`player ${player} percent: ${payload.percent}`);
  fs.writeFileSync(`./player${player}Percent.txt`, payload.percent.toFixed(0));
});

realtime.stock.countChange$.subscribe((payload) => {
  const player = payload.playerIndex + 1;
  console.log(`player ${player} stocks: ${payload.stocksRemaining}`);
  fs.writeFileSync(`./player${player}Stocks.txt`, payload.stocksRemaining.toString());
});
```

**NOTE: Please don't actually do this for real custom HUDs. Writing to files is slow and OBS takes a long time to update after file changes. If you actually want to build a custom layout for OBS you should use a browser source and send updates using websockets instead of writing data to a file.**

## Setup on WSL

If you're running your node project inside Windows Subsystem for Linux and running Dolphin or a relay in Windows, setup requires a couple extra steps:

1. Change the address passed to `livestream.start` to the one listed in `/etc/resolv.conf` instead of `localhost` 
(see https://devdojo.com/mvnarendrareddy/access-windows-localhost-from-wsl2).

2. Add a firewall rule allowing access from WSL (see https://superuser.com/a/1620974) 

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

- [Jas Laferriere](https://github.com/JLaferri) and the rest of the [Project Slippi](https://github.com/project-slippi) team

- [NikhilNarayana](https://github.com/NikhilNarayana) and his [Get Slippi Combos](https://gist.github.com/NikhilNarayana/d45e328e9ea47127634f2faf575e8dcf) script

## License

This software is released under the terms of [MIT license](LICENSE).

Linking back to [this Github repo](https://github.com/vinceau/slp-realtime) is much appreciated.
