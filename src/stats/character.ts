import EventEmitter from "events";
import StrictEventEmitter from 'strict-event-emitter-types';

import { FrameEntryType, PlayerIndexedType, PostFrameUpdateType, StatComputer } from 'slp-parser-js';

export interface CharacterState {
  percent: number;
}

export interface CharacterComputerEvents {
  percentChange: (playerIndex: number, percent: number) => void;
};

type CharacterComputeEventEmitter = { new(): StrictEventEmitter<EventEmitter, CharacterComputerEvents> };

type CharacterType = Map<PlayerIndexedType, CharacterState>;

export class CharacterComputer extends (EventEmitter as CharacterComputeEventEmitter) implements StatComputer<CharacterType> {
  private playerPermutations = new Array<PlayerIndexedType>();
  private state: CharacterType = new Map<PlayerIndexedType, CharacterState>();

  public setPlayerPermutations(playerPermutations: PlayerIndexedType[]): void {
    this.playerPermutations = playerPermutations;
    this.playerPermutations.forEach((indices) => {
      const playerState: CharacterState = {
        percent: 0,
      };
      this.state.set(indices, playerState);
    })
  }

  public processFrame(frame: FrameEntryType): void {
    this.playerPermutations.forEach((indices) => {
      this._updateStats(indices, frame);
    });
  }

  public fetch(): CharacterType {
    return this.state;
  }

  private _updateStats(indices: PlayerIndexedType, frame: FrameEntryType): void {
    const state = this.state.get(indices);
    const playerFrame: PostFrameUpdateType = frame.players[indices.playerIndex].post;
    if (state.percent !== playerFrame.percent) {
      state.percent = playerFrame.percent
      this.state.set(indices, state)
      this.emit("percentChange", indices.playerIndex, playerFrame.percent);
    }
  }

}