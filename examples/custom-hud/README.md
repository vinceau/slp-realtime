# Custom HUD Example

This is an example demonstrating the real-time capabilities of `slp-realtime` and its ability
to detect when player percentages change or stock count changes.

This script monitors a specific folder which has new SLP files being written to
and when percents change or stocks change, writes that data to a file to be rendered in OBS.

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
cd examples/custom-hud
yarn install
```

3. Set the SLP folder folder location

Open up the `index.js` file in your favourite editor, and modify the value for `slpLiveFolderPath` appropriately.
This should be the folder that Slippi Dolphin writes new SLP files to. You may want to also change the `playerInfoFolder`
variable.

4. Add those files to OBS

By default files are written to the desktop as `player1Stocks.txt` and `player1Percent.txt`. You should add
these files to OBS as a text source.

5. Run the actual code

```bash
node index.js
```
