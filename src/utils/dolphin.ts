import fs from "fs-extra";
import { ComboType, Frames } from "slp-parser-js";
import { shuffle } from "lodash";

interface DolphinQueue {
  mode: string;
  replay: string;
  isRealTimeMode: boolean;
  outputOverlayFiles: boolean;
  queue: DolphinCombo[];
}

const defaultSettings = {
  shuffle: true,
  startBuffer: 240,
  endBuffer: 180,
};

interface DolphinCombo {
  path: string;
  startFrame?: number;
  endFrame?: number;
  gameStation?: string;
  gameStartAt?: string;
  damageDone?: number;
  comboingCharacter?: number;
}

export type DolphinComboQueueOptions = typeof defaultSettings;

export class DolphinComboQueue {
  private options: DolphinComboQueueOptions;
  private combos: DolphinCombo[];

  public constructor(options?: Partial<DolphinComboQueueOptions>) {
    this.options = Object.assign({}, defaultSettings, options);
    this.combos = new Array<DolphinCombo>();
  }

  public addCombo(path: string, combo: ComboType, gameStation?: string, gameStartAt?: string, damageDone?: number, comboingCharacter?: number): void {
    const startFrame = Math.max(Frames.FIRST, combo.startFrame - this.options.startBuffer);
    // If endFrame is undefined it will just play to the end
    const endFrame = combo.endFrame ? combo.endFrame + this.options.endBuffer : undefined;
    this.combos.push({
      path,
      startFrame,
      endFrame,
      gameStation,
      gameStartAt,
      damageDone,
      comboingCharacter,
    });
  }

  public length(): number {
    return this.combos.length;
  }

  public clear(): void {
    this.combos = [];
  }

  public updateSettings(settings: Partial<DolphinComboQueueOptions>): void {
    this.options = Object.assign({}, this.options, settings);
  }

  public writeFileSync(filePath: string): number {
    const data = this._dataToWrite();
    fs.writeFileSync(filePath, data);
    return this.length();
  }

  /**
   * Asynchronously writes out the combos to a JSON file
   *
   * @param {string} filePath The name of the combos file
   * @returns {Promise<number>} The number of combos written out to the file
   * @memberof DolphinComboQueue
   */
  public async writeFile(filePath: string): Promise<number> {
    const data = this._dataToWrite();
    await fs.writeFile(filePath, data);
    return this.length();
  }

  private _dataToWrite(): string {
    const combos = (this.options.shuffle) ? shuffle(this.combos) : this.combos;
    const queue: DolphinQueue = {
      mode: "queue",
      replay: "",
      isRealTimeMode: false,
      outputOverlayFiles: true,
      queue: combos,
    };
    return JSON.stringify(queue, null, 2);
  }
}
