import _ from 'lodash';
import EventEmitter from "events";
import StrictEventEmitter from 'strict-event-emitter-types';

import { FrameEntryType, FramesType, isDead, didLoseStock, PlayerIndexedType, StockType, StatComputer } from 'slp-parser-js';

interface StockState {
  stock: StockType | null | undefined;
}

export interface StockComputerEvents {
  spawn: (player: number, stock: StockType) => void;
  death: (player: number, stock: StockType) => void;
};

type StockComputeEventEmitter = { new(): StrictEventEmitter<EventEmitter, StockComputerEvents> };

export class StockComputer extends (EventEmitter as StockComputeEventEmitter) implements StatComputer<StockType[]> {
  private state = new Map<PlayerIndexedType, StockState>();
  private playerPermutations = new Array<PlayerIndexedType>();
  private stocks = new Array<StockType>();

  public setPlayerPermutations(playerPermutations: PlayerIndexedType[]): void {
    this.playerPermutations = playerPermutations;
    this.playerPermutations.forEach((indices) => {
      const playerState: StockState = {
        stock: null,
      };
      this.state.set(indices, playerState);
    })
  }

  public processFrame(frame: FrameEntryType, allFrames: FramesType): void {
    this.playerPermutations.forEach((indices) => {
      const state = this.state.get(indices);
      this._handleStockCompute(allFrames, state, indices, frame, this.stocks);
    });
  }

  public fetch(): StockType[] {
    return this.stocks;
  }

  private _handleStockCompute(frames: FramesType, state: StockState, indices: PlayerIndexedType, frame: FrameEntryType, stocks: StockType[]): void {
    const playerFrame = frame.players[indices.playerIndex].post;
    // FIXME: use PostFrameUpdateType instead of any
    const prevPlayerFrame: any = _.get(
      frames, [playerFrame.frame - 1, 'players', indices.playerIndex, 'post'], {}
    );

    // If there is currently no active stock, wait until the player is no longer spawning.
    // Once the player is no longer spawning, start the stock
    if (!state.stock) {
      const isPlayerDead = isDead(playerFrame.actionStateId);
      if (isPlayerDead) {
        return;
      }

      state.stock = {
        playerIndex: indices.playerIndex,
        opponentIndex: indices.opponentIndex,
        startFrame: playerFrame.frame,
        endFrame: null,
        startPercent: 0,
        endPercent: null,
        currentPercent: 0,
        count: playerFrame.stocksRemaining,
        deathAnimation: null,
      };

      stocks.push(state.stock);
      this.emit("spawn", indices.playerIndex, state.stock);
    } else if (didLoseStock(playerFrame, prevPlayerFrame)) {
      state.stock.endFrame = playerFrame.frame;
      state.stock.endPercent = prevPlayerFrame.percent || 0;
      state.stock.deathAnimation = playerFrame.actionStateId;
      this.emit("death", indices.playerIndex, state.stock);
      state.stock = null;
    } else {
      state.stock.currentPercent = playerFrame.percent || 0;
    }
  }
}
