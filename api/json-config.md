# JSON Config API (DEPRECATED)

> Do not use this JSON Config API anymore! It is deprecated and will be completely removed in the next version!

To interface with this API you first instantiate an [`EventManager`](./types.md#eventmanager) object and you pass a configuration object which defines what kind of events you are interested in subscribing for.

[Click here](../examples/json-config) for the working example.

```javascript
const { SlpRealTime, EventManager } = require("@vinceau/slp-realtime");

// You will need to properly setup a realtime object
// beforehand. See the other examples for doing so.
const realtime = new SlpRealTime();
const eventManager = new EventManager(realtime);
```

## The Config Object

The [`EventManagerConfig`](./types.md#eventmanagerconfig) object contains the list of events that you want to subscribe to.

For example, let's say we were interested in the following 3 events:

1. when the game starts
2. when player 1 does a combo of at least 45%
3. when player 4 holds the buttons A and B for 2 seconds

Then our config object might look a little something like this:

```javascript
const config = {
    events: [
    {
        id: "event-1-game-start",
        type: "game-start",
    },
    {
        id: "event-2-player-1-combo",
        type: "combo-end",
        filter: {
            playerIndex: 0,  // Index 0 means player 1
            minComboPercent: 45,
        },
    },
    {
        id: "event-3-player-4-button-press",
        type: "button-combo",
        filter: {
            playerIndex: 3, // Index 3 means player 4
            combo: ["A", "B"],
            duration: 120, // 60 fps * 2 seconds
        },
    },
    ]
};

// Tell the event manager to use our config
eventManager.updateConfig(config);
```

There are 3 parts to each event:

* `id` - any name for this event so we know when it gets emitted.
* `type` - the type of event we want to subscribe to. [Click here](#subscribable-events) for a list of all the event types.
* `filter` - the additional parameters for finding the exact event we're interested in.

We then tell our `EventManager` to use this config object using the `updateConfig()` method.


## The Handler Function

Now we have to define what code we want to execute each time the event occurs. For simplicity, we're just going to log a message and the payload to the console.

```javascript
eventManager.events$.subscribe(event => {
    switch (event.id) {
    case "event-1-game-start":
        console.log("A new game is starting!");
        break;
    case "event-2-player-1-combo":
        console.log("Player 1 did a combo!");
        break;
    case "event-3-player-4-button-press":
        console.log("Player 4 held A+B for 2 seconds!");
        break;
    }
    // Also log the event payload
    console.log(event.payload);
});
```

And that's it! Once the `SlpRealTime` object starts receiving data, `EventManager` will automatically start notifying your handler of notable events!

## Subscribable Events

Here is the list of event types which you can subscribe to:

### `game-start`

Emitted when the game starts.

Payload: [`GameStartType`](./types.md#gamestarttype)

Filters:

* `numPlayers` (`number`) - the number of players in the game
* `isTeams` (`number`) - whether the game is a teams match or not

### `game-end`

Emitted when the game ends.

Payload: [`GameEndPayload`](./types.md#gameendpayload)

Filters:

* `endMethod` ([`GameEndMethod`](./types.md#gameendmethod)) - the way the game ended
* `winnerPlayerIndex` (`number`) - the index of the winner e.g. 0 means P1 won, 1 means P2 won etc.

### `player-spawn`

Emitted when a player spawns.

Payload: [`StockType`](./types.md#stocktype)

Filters:

* `playerIndex` (`number`) - the index of the player which spawned

### `player-died`

Emitted when a player dies.

Payload: [`StockType`](./types.md#stocktype)

Filters:

* `playerIndex` (`number`) - the index of the player which died

### `combo-start`

Emitted when a combo is starting.

Payload: [`ComboEventPayload`](./types.md#comboeventpayload)

Filters:

* `playerIndex` (`number`) - the index of the player performing the combo

### `combo-extend`

Emitted for each hit that extends a combo.

Payload: [`ComboEventPayload`](./types.md#comboeventpayload)

Filters:

* `playerIndex` (`number`) - the index of the player performing the combo

### `combo-end`

Emitted at the end of the combo.

Payload: [`ComboEventPayload`](./types.md#comboeventpayload)

Filters:

* `playerIndex` (`number`) - the index of the player performing the combo
* `comboCriteria` ([`ComboFilterSettings`](./types.md#combofiltersettings)) - any combination of the different combo filter settings, or `"none"` to match every possible combos. If omitted, it will match against the default combo parameter settings.

Please note: `playerIndex` and the [`portFilter`](./types.md#portfilter) cannot be used together! If you provide a player index that doesn't match a player port, you will not find any combos!

### `conversion`

Payload: [`ComboEventPayload`](./types.md#comboeventpayload)

Filters:

* `playerIndex` (`number`) - the index of the player performing the combo
* `comboCriteria` ([`ComboFilterSettings`](./types.md#combofiltersettings)) - any combination of the different combo filter settings, or `"none"` to match every possible conversion. If omitted, it will match against the default combo parameter settings.

Please note: `playerIndex` and the `portFilter` cannot be used together! If you provide a player index that doesn't match a player port, you will not find any combos!

### `button-combo`

Payload: [`InputButtonCombo`](./types.md#inputbuttoncombo)

Filters:

* `playerIndex` (`number`) - the index of the player doing the button combination
* `combo` ([`Input`](./types.md#input)[]) - a list of button inputs
* `duration` (`number`) - the duration in frames the button(s) are held for e.g. 2 seconds = 120 frames. The default is 1 frame.
