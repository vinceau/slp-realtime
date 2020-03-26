# RxJS Observable API

[RxJS Observables](https://rxjs-dev.firebaseapp.com/guide/overview) provides a powerful interface for subscribing to real-time events.
Here is the list of observables that are exposed by `slp-realtime`.

## Events

### Game

#### `realtime.game.start$`

Emitted when a game starts.

Returns an `Observable<`[`GameStartType`](./types.md#gamestarttype)`>`

#### `realtime.game.end$`

Emitted when a game ends.

Returns an `Observable<`[`GameEndType`](./types.md#gameendtype)`>`

### Stock

#### `realtime.stock.playerSpawn$`

Emitted when a player spawns.

Returns an `Observable<`[`StockType`](./types.md#stocktype)`>`

#### `realtime.stock.playerDied$`

Emitted when a player dies.

Returns an `Observable<`[`StockType`](./types.md#stocktype)`>`

#### `realtime.stock.percentChange$`

Emitted when a player's percent changes.

Returns an `Observable<`[`PercentChange`](./types.md#percentchange)`>`

#### `realtime.stock.countChange$`

Emitted when the number of stocks a player has changes.

Returns an `Observable<`[`StockCountChange`](./types.md#stockcountchange)`>`


### Combo

#### `realtime.combo.start$`

Emitted when a combo starts.

Returns an `Observable<`[`ComboEventPayload`](./types.md#comboeventpayload)`>`

#### `realtime.combo.extend$`

Emitted for each additional hit that lands during a combo.

Returns an `Observable<`[`ComboEventPayload`](./types.md#comboeventpayload)`>`

#### `realtime.combo.end$`

Emitted when a combo ends.

Returns an `Observable<`[`ComboEventPayload`](./types.md#comboeventpayload)`>`


#### `realtime.combo.conversion$`

Emitted when a conversion occurs.

Returns an `Observable<`[`ComboEventPayload`](./types.md#comboeventpayload)`>`
