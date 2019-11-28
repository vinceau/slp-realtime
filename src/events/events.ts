import { PlayerIndexedType, FrameEntryType, FramesType, State } from "slp-parser-js";

/*
We need a way to fire an event when a sequence of player animations occur.

We should be able to define a list of action states, for example:
EVENT.WAVEDASH = [State.DASH, State.TURN, State.DASH];
And then whenever a wavedash occurs, we can emit an event which can trigger
another set of actions.

We should ideally calculate this per frame, so that the moment the last frame
of an event occurs, we will fire off the event.
We need a way to define some sort of state machine, and take each player state
of a frame as an action.

The final state is the state where the event will be fired.

We need to define something like this:
state1: [possible player action states]
transitions to -> upon what action


{
    state1: {
        transitions: [State.DASH], // any of these states will take us from the initial state to state1
        from: "initial",
    }
    state2: {
        transitions: [State.TURN], // any of these states will take us from the initial state to state1
        from: "state1",
    },
    final: {
        transitions: [State.DASH], // any of these states will take us from the initial state to state1
        from: "state2",
    },
}
() => {

}

*/

interface TransitionDefinition {
  transitions: State[];
  from: string;
  negate?: boolean;
}

const INITIAL_STATE = "initial";
const FINAL_STATE = "final";

interface ActionDefinition {
  [state: string]: TransitionDefinition;
}

interface PlayerActionEvent {
  setPlayerPermutations(indices: PlayerIndexedType[]): void;
  processFrame(newFrame: FrameEntryType, allFrames: FramesType): void;
}

export class TrackPlayerAction implements PlayerActionEvent {
  private state: Map<PlayerIndexedType, string>;
  private stateActions: ActionDefinition;
  private playerPermutations = new Array<PlayerIndexedType>();
  private resetToState: string;
  private callback: () => void;

  public constructor(stateActions: ActionDefinition, callback: () => void, resetToState = INITIAL_STATE) {
    this.state = new Map<PlayerIndexedType, string>();
    this.stateActions = stateActions;
    this.callback = callback;
    this.resetToState = resetToState;
  }

  public setPlayerPermutations(indices: PlayerIndexedType[]): void {
    this.playerPermutations = indices;
    this.playerPermutations.forEach((i) => {
      this.state.set(i, INITIAL_STATE);
    });
  }

  public processFrame(frame: FrameEntryType): void {
    this.playerPermutations.forEach((index) => {
      const state = this.state.get(index);
      const playerFrame = frame.players[index.playerIndex].post;
      const currentAnimation = playerFrame.actionStateId;
      for (const nextState in this.stateActions) {
        const { from, transitions, negate } = this.stateActions[nextState];

        // Find the transitions for the current state
        if (state !== from) {
          continue;
        }

        // Check if we can transition based off the current animation
        let canTransition = transitions.includes(currentAnimation);
        if (negate) {
          canTransition = !canTransition;
        }

        if (canTransition) {
          // We can successfully transition into the next state
          if (nextState !== FINAL_STATE) {
            // proceed to the next state
            this.state.set(index, nextState);
            return;
          }

          // We are at the final state so trigger callback and exit loop
          this.callback();
          // Reset back to the specified state
          this.state.set(index, this.resetToState);
          return;
        }
        break;
      }

      // Reset back to the initial state.
      this.state.set(index, INITIAL_STATE);
    });
  }
}