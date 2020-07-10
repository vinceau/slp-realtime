import path from "path";
import { get } from "lodash";
import moment, { Moment } from "moment";

import { SlpFile, SlpFileMetadata } from "./slpFile";
import { SlpStream } from "./slpStream";
import { Command } from "@slippi/sdk";
import { PostFrameUpdateType } from "../types";

const defaultSettings = {
  outputFiles: false,
  folderPath: ".",
  consoleNick: "unknown",
};

export type SlpFileWriterOptions = typeof defaultSettings;

/**
 * SlpFileWriter lets us not only emit events as an SlpStream but also
 * writes the data that is being passed in to an SLP file. Use this if
 * you want to process Slippi data in real time but also want to be able
 * to write out the data to an SLP file.
 *
 * @export
 * @class SlpFileWriter
 * @extends {SlpStream}
 */
export class SlpFileWriter extends SlpStream {
  private currentFile: SlpFile | null;
  private metadata: SlpFileMetadata;
  private options: SlpFileWriterOptions;

  /**
   * Creates an instance of SlpFileWriter.
   * @param {Partial<SlpFileWriterOptions>} [options] The options for the SlpWriter
   * @memberof SlpFileWriter
   */
  public constructor(options?: Partial<SlpFileWriterOptions>) {
    super();
    this.options = Object.assign({}, defaultSettings, options);
    this.metadata = {
      lastFrame: -124,
      players: {},
    };
    // this.on(SlpEvent.RAW_COMMAND, (command: Command, buffer: Uint8Array) => {
    this.rawCommand$.subscribe((data) => {
      if (this.currentFile) {
        this.currentFile.write(data.payload);
      }
    });
    // this.on(SlpEvent.POST_FRAME_UPDATE, (command: Command, payload: PostFrameUpdateType) => {
    this.postFrameUpdate$.subscribe((payload) => {
      this._handlePostFrameUpdate(Command.POST_FRAME_UPDATE, payload);
    });
    this.messageSize$.subscribe(() => {
      this._handleNewGame();
    });
    this.gameEnd$.subscribe(() => {
      this._handleEndGame();
    });
  }

  /**
   * Return the name of the SLP file currently being written or null if
   * no file is being written to currently.
   *
   * @returns {(string | null)}
   * @memberof SlpFileWriter
   */
  public getCurrentFilename(): string | null {
    if (this.currentFile !== null) {
      return path.resolve(this.currentFile.path());
    }
    return null;
  }

  /**
   * Updates the settings to be the desired ones passed in.
   *
   * @param {Partial<SlpFileWriterOptions>} settings
   * @memberof SlpFileWriter
   */
  public updateSettings(settings: Partial<SlpFileWriterOptions>): void {
    this.options = Object.assign({}, this.options, settings);
  }

  private _handleNewGame(): void {
    if (this.options.outputFiles) {
      const filePath = getNewFilePath(this.options.folderPath, moment());
      this.currentFile = new SlpFile(filePath);
      console.log(`Creating new file at: ${filePath}`);
    }
  }

  private _handlePostFrameUpdate(command: number, payload: PostFrameUpdateType): void {
    if (payload.isFollower) {
      // No need to do this for follower
      return;
    }

    // Update frame index
    this.metadata.lastFrame = payload.frame;

    // Update character usage
    const playerIndex = payload.playerIndex;
    const internalCharacterId = payload.internalCharacterId;
    const prevPlayer = get(this.currentFile, ["metadata", "players", `${playerIndex}`]) || {};
    const characterUsage = prevPlayer.characterUsage || {};
    const curCharFrames = characterUsage[internalCharacterId] || 0;
    const player = {
      ...prevPlayer,
      characterUsage: {
        ...characterUsage,
        [internalCharacterId]: curCharFrames + 1,
      },
    };
    this.metadata.players[`${playerIndex}`] = player;
  }

  private _handleEndGame(): void {
    // End the stream
    if (this.currentFile) {
      // Set the console nickname before writing the metadata
      this.metadata.consoleNickname = this.options.consoleNick;
      this.currentFile.setMetadata(this.metadata);
      this.currentFile.end();
      console.log(`Finished writing file: ${this.currentFile.path()}`);
      // Clear current file
      this.currentFile = null;
    }
  }
}

const getNewFilePath = (folder: string, m: Moment): string => {
  return path.join(folder, `Game_${m.format("YYYYMMDD")}T${m.format("HHmmss")}.slp`);
};
