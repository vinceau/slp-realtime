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


// start ->
{
    initial: [
        {
            states: [State.TURN],
            to: "state2"
        },
        {
            states: [State.DASH],
            to: "state3"
        }
    ],
    state1: [
        {
            transitions: [State.DASH], // any of these states will take us from the initial state to state1
            from: "initial",
        },
        {
            transitions: [State.DASH], // any of these states will take us from the initial state to state1
            from: "state2",
        }
    ],
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
  states: State[];
  to: string;
  negate?: boolean;
}

const INITIAL_STATE = "initial";
const FINAL_STATE = "final";

interface ActionStateDefinition {
  [fromState: string]: TransitionDefinition[];
}

interface PlayerActionEvent {
  setPlayerPermutations(indices: PlayerIndexedType[]): void;
  processFrame(newFrame: FrameEntryType, allFrames: FramesType): void;
}

interface ActionSettings {
  resetToState: string;
  resetOnNoTransition: boolean;
}

const defaultActionSettings: ActionSettings = {
  resetToState: INITIAL_STATE,
  resetOnNoTransition: true,
};

export class TrackPlayerAction implements PlayerActionEvent {
  private state: Map<PlayerIndexedType, string>;
  private actionStates: ActionStateDefinition;
  private playerPermutations = new Array<PlayerIndexedType>();
  private settings: ActionSettings;
  private callback: () => void;

  public constructor(stateActions: ActionStateDefinition, callback: () => void, options?: Partial<ActionSettings>) {
    this.state = new Map<PlayerIndexedType, string>();
    this.actionStates = stateActions;
    this.settings = Object.assign({}, defaultActionSettings, options);
    this.callback = callback;
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
      const transitions = this.actionStates[state] || [];
      for (const transition of transitions) {
        const { to, states, negate } = transition;

        // Check if we can transition based off the current animation
        let canTransition = states.includes(currentAnimation);
        if (negate) {
          canTransition = !canTransition;
        }

        if (canTransition) {
          // We can successfully transition into the next state
          if (to !== FINAL_STATE) {
            // proceed to the next state
            this.state.set(index, to);
            return;
          }

          // We are at the final state so trigger callback and exit loop
          this.callback();
          // Reset back to the specified state
          this.state.set(index, this.settings.resetToState);
          return;
        }
        break;
      }

      if (this.settings.resetOnNoTransition) {
        // Reset back to the initial state.
        this.state.set(index, INITIAL_STATE);
      }
    });
  }
}