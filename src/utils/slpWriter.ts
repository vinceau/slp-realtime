import path from "path";
import _ from "lodash";
import moment, { Moment } from "moment";

import { SlpFile, SlpFileMetadata } from "./slpFile";
import { SlpStream, SlpEvent } from "./slpStream";
import { Command, PostFrameUpdateType } from "slp-parser-js";

const defaultSettings = {
  outputFiles: false,
  folderPath: ".",
  consoleNick: "unknown",
}

export type SlpFileWriterOptions = typeof defaultSettings;

export class SlpFileWriter extends SlpStream {
  private currentFile: SlpFile | null;
  private metadata: SlpFileMetadata;
  private options: SlpFileWriterOptions;

  public constructor(options?: Partial<SlpFileWriterOptions>) {
    super();
    this.options = Object.assign({}, defaultSettings, options);
    this.metadata = {
      lastFrame: -124,
      players: {},
    };
    this.on(SlpEvent.RAW_COMMAND, (command: Command, buffer: Uint8Array) => {
      if (this.currentFile) {
        this.currentFile.write(buffer);
      }
    })
    this.on(SlpEvent.POST_FRAME_UPDATE, (command: Command, payload: PostFrameUpdateType) => {
      this._handlePostFrameUpdate(command, payload);
    })
    this.on(SlpEvent.MESSAGE_SIZES, () => {
      this._handleNewGame();
    })
    this.on(SlpEvent.GAME_END, () => {
      this._handleEndGame();
    })
  }

  public getCurrentFilename(): string | null {
    if (this.currentFile !== null) {
      return path.resolve(this.currentFile.path());
    }
    return null;
  }

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
    const prevPlayer = _.get(this.currentFile, ["metadata", "players", `${playerIndex}`]) || {};
    const characterUsage = prevPlayer.characterUsage || {};
    const curCharFrames = characterUsage[internalCharacterId] || 0;
    const player = {
      ...prevPlayer,
      "characterUsage": {
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
}
