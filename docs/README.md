# Documentation

## API

### Types

#### `GameStartType`

| Key | Type |
| --- | ---- |
| `slpVersion` | `string | null` |
| `isTeams` | `boolean | null` |
| `isPAL` | `boolean | null` |
| `stageId` | `number | null` |
| `players` | `PlayerType[]` |


#### `GameEndType`

| Key | Type |
| --- | ---- |
| `gameEndMethod` | `number | null` |
| `lrasInitiatorIndex` | `number | null` |

#### `ComboType`

| Key | Type |
| --- | ---- |
| `playerIndex` | `number` |
| `opponentIndex` | `number` |
| `startFrame` | `number` |
| `endFrame` | `number | null | undefined` |
| `startPercent` | `number` |
| `currentPercent` | `number`;
| `endPercent` | `number | null | undefined` |

---

| Key | Type |
| --- | ---- |
| `moves` | `MoveLandedType[]` |
| `didKill` | `boolean` |

#### `StockType`

| Key | Type |
| --- | ---- |
| `count` | `number` |
| `deathAnimation` | `number | null | undefined` |

#### `PlayerType`

| Key | Type |
| --- | ---- |
| `playerIndex` | `number` |
| `port` | `number` |
| `characterId` | `number | null` |
| `characterColor` | `number | null` |
| `startStocks` | `number | null` |
| `type` | `number | null` |
| `teamId` | `number | null` |
| `controllerFix` | `string | null` |
| `nametag` | `string | null` |

#### `MoveLandedType`
