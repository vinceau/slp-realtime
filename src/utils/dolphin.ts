import fs from "fs-extra";
import { ComboType, Frames } from "slp-parser-js";
import { shuffle } from "lodash";

export interface DolphinPlaybackItem {
  path: string;
  combo?: ComboType;
  gameStation?: string;
  gameStartAt?: string;
}

interface DolphinQueueFormat {
  mode: string;
  replay: string;
  isRealTimeMode: boolean;
  outputOverlayFiles: boolean;
  queue: DolphinEntry[];
}

const defaultSettings = {
  shuffle: true,
  mode: "queue",
  replay: "",
  isRealTimeMode: false,
  outputOverlayFiles: true,
  startBuffer: 240,
  endBuffer: 180,
  prettify: true,
};

interface DolphinEntry {
  path: string;
  startFrame?: number;
  endFrame?: number;
  gameStation?: string;
  gameStartAt?: string;
}

export type DolphinPlaybackQueueOptions = typeof defaultSettings;

export class DolphinPlaybackQueue implements Iterable<DolphinPlaybackItem>{
  private items = new Array<DolphinPlaybackItem>();

  public push(item: DolphinPlaybackItem): void {
    this.items.push(item);
  }

  public entries(): IterableIterator<[number, DolphinPlaybackItem]> {
    return this.items.entries();
  }

  public length(): number {
    return this.items.length;
  }

  public clear(): void {
    this.items = [];
  }

  public writeFileSync(filePath: string, options?: Partial<DolphinPlaybackQueueOptions>): number {
    const data = this._dataToWrite(options);
    fs.writeFileSync(filePath, data);
    return this.length();
  }

  /**
   * Asynchronously writes out the combos to a JSON file
   *
   * @param {string} filePath The name of the combos file
   * @returns {Promise<number>} The number of combos written out to the file
   * @memberof DolphinPlaybackQueue
   */
  public async writeFile(filePath: string, options?: Partial<DolphinPlaybackQueueOptions>): Promise<number> {
    const data = this._dataToWrite(options);
    await fs.writeFile(filePath, data);
    return this.length();
  }

  // Define the iterator so we can iterate through the list of items
  public [Symbol.iterator](): Iterator<DolphinPlaybackItem, any, undefined> {
    let counter = 0;
    const items = this.items;
    return {
      next(): IteratorResult<DolphinPlaybackItem, any> {
        if (++counter < items.length) {
          return {
            done: false,
            value: items[counter - 1],
          }
        } else {
          return {
            done: true,
            value: undefined,
          }
        }
      }
    }
  }

  private _dataToWrite(options: Partial<DolphinPlaybackQueueOptions>): string {
    const opts: DolphinPlaybackQueueOptions = Object.assign({}, defaultSettings, options);
    const entries = opts.shuffle ? shuffle(this.items) : this.items;
    const queue = entries.map(entry => mapDolphinEntry(entry, opts.startBuffer, opts.endBuffer));
    const dolphinQueue: DolphinQueueFormat = {
      mode: opts.mode,
      replay: opts.replay,
      isRealTimeMode: opts.isRealTimeMode,
      outputOverlayFiles: opts.outputOverlayFiles,
      queue,
    };
    const spaces = opts.prettify ? 2 : undefined;
    return JSON.stringify(dolphinQueue, undefined, spaces);
  }

}

const mapDolphinEntry = (entry: DolphinPlaybackItem, startBuffer: number, endBuffer: number): DolphinEntry => {
  const { path, gameStation, gameStartAt, combo } = entry;
  const dolphinEntry: DolphinEntry = {
    path,
    gameStation,
    gameStartAt,
  };
  if (combo) {
    dolphinEntry.startFrame = Math.max(Frames.FIRST, combo.startFrame - startBuffer);
    // If endFrame is undefined it will just play to the end
    if (combo.endFrame) {
      dolphinEntry.endFrame = combo.endFrame + endBuffer;
    }
  }
  return dolphinEntry;
};
