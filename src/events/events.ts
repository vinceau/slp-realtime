import { State } from "slp-parser-js";

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

export class TrackPlayerAction {
  private state: string;
  private actionStates: ActionStateDefinition;

  public constructor(stateActions: ActionStateDefinition, initialState?: string) {
    this.actionStates = stateActions;
    this.reset(initialState);
  }

  public step(action: State): boolean {
    const transitions = this.actionStates[this.state] || [];
    for (const transition of transitions) {
      const { to, states, negate } = transition;

      // Check if we can transition based off the current animation
      let canTransition = states.includes(action);
      if (negate) {
        canTransition = !canTransition;
      }

      if (canTransition) {
        // We can successfully transition into the next state
        if (to === FINAL_STATE) {
          return true;
        }
        // proceed to the next state
        this.state = to;
      }
      break;
    }
    return false;
  }

  public reset(state?: string): void {
    // Make sure it's a valid state
    if (state && Object.keys(this.actionStates).includes(state)) {
      this.state = state;
    } else {
      this.state = INITIAL_STATE;
    }
  }
}