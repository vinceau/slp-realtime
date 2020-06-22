import { last } from "lodash";

import { ComboEventPayload, FrameEntryType, ComboType, PostFrameUpdateType, GameStartType } from "../types";
import {
  MoveLandedType,
  PlayerIndexedType,
  isDamaged,
  isGrabbed,
  calcDamageTaken,
  isTeching,
  didLoseStock,
  Timers,
  isDown,
  isDead,
  getSinglesPlayerPermutationsFromSettings,
} from "slp-parser-js";
import { Subject, Observable } from "rxjs";
import { SlpStream } from "..";
import { filter, switchMap } from "rxjs/operators";
import { withPreviousFrame } from "../operators/frames";
import { ConversionEvents } from "./conversion";

enum ComboEvent {
  Start = "start",
  Extend = "extend",
  End = "end",
}

interface ComboState {
  combo: ComboType | null;
  move: MoveLandedType | null;
  resetCounter: number;
  lastHitAnimation: number | null;
  event: ComboEvent | null;
}

export class ComboEvents {
  private stream$: Observable<SlpStream>;

  private settings: GameStartType;
  private playerPermutations = new Array<PlayerIndexedType>();
  private state = new Map<PlayerIndexedType, ComboState>();
  private combos = new Array<ComboType>();

  private comboStartSource = new Subject<ComboEventPayload>();
  private comboExtendSource = new Subject<ComboEventPayload>();
  private comboEndSource = new Subject<ComboEventPayload>();

  public start$ = this.comboStartSource.asObservable();
  public extend$ = this.comboExtendSource.asObservable();
  public end$ = this.comboEndSource.asObservable();
  public conversion$: Observable<ComboEventPayload>;

  private resetState(): void {
    this.playerPermutations = new Array<PlayerIndexedType>();
    this.state = new Map<PlayerIndexedType, ComboState>();
    this.combos = new Array<ComboType>();
  }

  public constructor(stream: Observable<SlpStream>) {
    this.stream$ = stream;

    const conversionEvents = new ConversionEvents(stream);
    this.conversion$ = conversionEvents.end$;

    // Reset the state on game start
    this.stream$.pipe(switchMap((s) => s.gameStart$)).subscribe((settings) => {
      this.resetState();
      // We only care about the 2 player games
      if (settings.players.length === 2) {
        const perms = getSinglesPlayerPermutationsFromSettings(settings);
        this.setPlayerPermutations(perms);
        this.settings = settings;
      }
    });

    // Handle the frame processing
    this.stream$
      .pipe(
        switchMap((s) => s.playerFrame$),
        // We only want the frames for two player games
        filter((frame) => {
          const players = Object.keys(frame.players);
          return players.length === 2;
        }),
        withPreviousFrame(),
      )
      .subscribe(([prevFrame, latestFrame]) => {
        this.processFrame(prevFrame, latestFrame);
      });
  }

  private setPlayerPermutations(playerPermutations: PlayerIndexedType[]): void {
    this.playerPermutations = playerPermutations;
    this.playerPermutations.forEach((indices) => {
      const playerState: ComboState = {
        combo: null,
        move: null,
        resetCounter: 0,
        lastHitAnimation: null,
        event: null,
      };
      this.state.set(indices, playerState);
    });
  }

  private processFrame(prevFrame: FrameEntryType, latestFrame: FrameEntryType): void {
    this.playerPermutations.forEach((indices) => {
      const state = this.state.get(indices);
      handleComboCompute(state, indices, prevFrame, latestFrame, this.combos);
      switch (state.event) {
        case ComboEvent.Start:
          this.comboStartSource.next({
            combo: state.combo,
            settings: this.settings,
          });
          break;
        case ComboEvent.Extend:
          this.comboExtendSource.next({
            combo: state.combo,
            settings: this.settings,
          });
          break;
        case ComboEvent.End:
          this.comboEndSource.next({
            combo: last(this.combos),
            settings: this.settings,
          });
          break;
      }
      if (state.event !== null) {
        state.event = null;
      }
    });
  }
}

function handleComboCompute(
  state: ComboState,
  indices: PlayerIndexedType,
  prevFrame: FrameEntryType,
  latestFrame: FrameEntryType,
  combos: ComboType[],
): void {
  const playerFrame: PostFrameUpdateType = latestFrame.players[indices.playerIndex].post;
  const prevPlayerFrame: PostFrameUpdateType = prevFrame.players[indices.playerIndex].post;
  const opponentFrame: PostFrameUpdateType = latestFrame.players[indices.opponentIndex].post;
  const prevOpponentFrame: PostFrameUpdateType = prevFrame.players[indices.opponentIndex].post;

  const opntIsDamaged = isDamaged(opponentFrame.actionStateId);
  const opntIsGrabbed = isGrabbed(opponentFrame.actionStateId);
  const opntDamageTaken = calcDamageTaken(opponentFrame, prevOpponentFrame);

  // Keep track of whether actionState changes after a hit. Used to compute move count
  // When purely using action state there was a bug where if you did two of the same
  // move really fast (such as ganon's jab), it would count as one move. Added
  // the actionStateCounter at this point which counts the number of frames since
  // an animation started. Should be more robust, for old files it should always be
  // null and null < null = false
  const actionChangedSinceHit = playerFrame.actionStateId !== state.lastHitAnimation;
  const actionCounter = playerFrame.actionStateCounter;
  const prevActionCounter = prevPlayerFrame.actionStateCounter;
  const actionFrameCounterReset = actionCounter < prevActionCounter;
  if (actionChangedSinceHit || actionFrameCounterReset) {
    state.lastHitAnimation = null;
  }

  // If opponent took damage and was put in some kind of stun this frame, either
  // start a combo or count the moves for the existing combo
  if (opntIsDamaged || opntIsGrabbed) {
    let comboStarted = false;
    if (!state.combo) {
      state.combo = {
        playerIndex: indices.playerIndex,
        opponentIndex: indices.opponentIndex,
        startFrame: playerFrame.frame,
        endFrame: null,
        startPercent: prevOpponentFrame.percent || 0,
        currentPercent: opponentFrame.percent || 0,
        endPercent: null,
        moves: [],
        didKill: false,
      };

      combos.push(state.combo);
      comboStarted = true;
    }

    if (opntDamageTaken) {
      // If animation of last hit has been cleared that means this is a new move. This
      // prevents counting multiple hits from the same move such as fox's drill
      if (!state.lastHitAnimation) {
        state.move = {
          frame: playerFrame.frame,
          moveId: playerFrame.lastAttackLanded,
          hitCount: 0,
          damage: 0,
        };

        state.combo.moves.push(state.move);
        if (!comboStarted) {
          state.event = ComboEvent.Extend;
        }
      }

      if (state.move) {
        state.move.hitCount += 1;
        state.move.damage += opntDamageTaken;
      }

      // Store previous frame animation to consider the case of a trade, the previous
      // frame should always be the move that actually connected... I hope
      state.lastHitAnimation = prevPlayerFrame.actionStateId;
    }

    if (comboStarted) {
      state.event = ComboEvent.Start;
    }
  }

  if (!state.combo) {
    // The rest of the function handles combo termination logic, so if we don't
    // have a combo started, there is no need to continue
    return;
  }

  const opntIsTeching = isTeching(opponentFrame.actionStateId);
  const opntIsDowned = isDown(opponentFrame.actionStateId);
  const opntDidLoseStock = didLoseStock(opponentFrame, prevOpponentFrame);
  const opntIsDying = isDead(opponentFrame.actionStateId);

  // Update percent if opponent didn't lose stock
  if (!opntDidLoseStock) {
    state.combo.currentPercent = opponentFrame.percent || 0;
  }

  if (opntIsDamaged || opntIsGrabbed || opntIsTeching || opntIsDowned || opntIsDying) {
    // If opponent got grabbed or damaged, reset the reset counter
    state.resetCounter = 0;
  } else {
    state.resetCounter += 1;
  }

  let shouldTerminate = false;

  // Termination condition 1 - player kills opponent
  if (opntDidLoseStock) {
    state.combo.didKill = true;
    shouldTerminate = true;
  }

  // Termination condition 2 - combo resets on time
  if (state.resetCounter > Timers.COMBO_STRING_RESET_FRAMES) {
    shouldTerminate = true;
  }

  // If combo should terminate, mark the end states and add it to list
  if (shouldTerminate) {
    state.combo.endFrame = playerFrame.frame;
    state.combo.endPercent = prevOpponentFrame.percent || 0;
    state.event = ComboEvent.End;

    state.combo = null;
    state.move = null;
  }
  // if (state.event) {
  //   console.log(state.event);
  // }
}
