# Documentation

## Classes

### `ComboFilter`



#### Methods

### `DolphinComboQueue`

### `SlippiLivestream`

### `SlippiRealtime`

### `SlpStream`

### `SlpFile`

### `SlpFileWriter`



## API

### Types

#### `GameStartType`

| Key | Type |
| --- | ---- |
| `slpVersion` | `string \| null` |
| `isTeams` | `boolean \| null` |
| `isPAL` | `boolean \| null` |
| `stageId` | `number \| null` |
| `players` | [`PlayerType`](#playertype)[] |


#### `GameEndType`

| Key | Type |
| --- | ---- |
| `gameEndMethod` | `number \| null` |
| `lrasInitiatorIndex` | `number \| null` |

#### `ComboType`

| Key | Type |
| --- | ---- |
| `playerIndex` | `number` |
| `opponentIndex` | `number` |
| `startFrame` | `number` |
| `endFrame` | `number \| null \| undefined` |
| `startPercent` | `number` |
| `currentPercent` | `number` |
| `endPercent` | `number \| null \| undefined` |
| `moves` | [`MoveLandedType`](#movelandedtype)[] |
| `didKill` | `boolean` |

#### `StockType`

| Key | Type |
| --- | ---- |
| `playerIndex` | `number` |
| `opponentIndex` | `number` |
| `startFrame` | `number` |
| `endFrame` | `number \| null \| undefined` |
| `startPercent` | `number` |
| `currentPercent` | `number` |
| `endPercent` | `number \| null \| undefined` |
| `count` | `number` |
| `deathAnimation` | `number \| null \| undefined` |

#### `PlayerType`

| Key | Type |
| --- | ---- |
| `playerIndex` | `number` |
| `port` | `number` |
| `characterId` | `number \| null` |
| `characterColor` | `number \| null` |
| `startStocks` | `number \| null` |
| `type` | `number \| null` |
| `teamId` | `number \| null` |
| `controllerFix` | `string \| null` |
| `nametag` | `string \| null` |

#### `MoveLandedType`

| Key        | Type     |
| ---------- | -------- |
| `frame`    | `number` |
| `moveId`   | `number` |
| `hitCount` | `number` |
| `damage`   | `number` |


#### `ComboFilterSettings`

##### `characterFilter`

* Type: `number[]`
* Default: `[]`

Only match if one of these characters are performing the combo.

##### `portFilter`

* Type: `number[]`
* Default: `[0, 1, 2, 3]`

Only match if the player is using one of these ports. Note that the ports are 0 indexed. This means that Player 1 is `0`, Player 2 is `1`, etc.

##### `nameTags`

* Type: `string[]`
* Default: `[]`

Only match if the player has this name tag.

##### `minComboLength`

* Type: `number`
* Default: `1`

Only match if the combo has at least this many moves.

##### `minComboPercent`

* Type: `number`
* Default: `60`

Only match if the combo does at least this much percent.

##### `comboMustKill`

* Type: `boolean`
* Default: `true`

Only match if the combo killed.

##### `excludeCPUs`

* Type: `boolean`
* Default: `true`

Don't match if the character being combo'd is a CPU.

##### `excludeChainGrabs`

* Type: `boolean`
* Default: `true`

Don't match if the combo is mostly chain-grabs.

##### `chainGrabThreshold`

* Type: `number`
* Default: `0.8`

The proportion of up-throw and pummels to other moves for the combo to be considered mostly chain grabs.

##### `excludeWobbles`

* Type: `boolean`
* Default: `true`

Don't match if the combo is mostly wobbling.

##### `wobbleThreshold`

* Type: `number`
* Default: `8`

The number of consecutive pummels before it's considered a wobble.

##### `largeHitThreshold`

* Type: `number`
* Default: `0.8`

Don't match if this decimal percentage of the combo damage was done by one single move.

##### `chainGrabbers`

* Type: `number[]`
* Default: `[Character.MARTH, Character.PEACH, Character.PIKACHU, Character.DR_MARIO]`

The characters which the should be considered for chain-grabbing in [`excludeChainGrabs`](#excludechaingrabs).

##### `perCharacterMinComboPercent`

* Type: `{ [characterId: number]: number }`
* Default: `{ [Character.JIGGLYPUFF]: 85 }`

The minimum amount of damage that a specific character performing a combo needs to do. This is mainly to combat characters like Puff which often will end combos in rest. This probably isn't if you adjust the [`minComboLength`](#mincombolength) but it's included for backwards compatibility with the combo script.
