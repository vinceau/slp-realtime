/**
 * We can tap into the Dolphin state by reading the log printed to stdout.
 * This will let us automate the recording.
 *
 * Dolphin will emit the following messages in following order:
 * [PLAYBACK_START_FRAME]: the frame playback will commence (defaults to -123 if omitted)
 * [GAME_END_FRAME]: the last frame of the game
 * [PLAYBACK_END_FRAME] this frame playback will end at (defaults to MAX_INT if omitted)
 * [CURRENT_FRAME] the current frame being played back
 * [NO_GAME] no more files in the queue
 */

import { Observable, ReplaySubject, from, Subscription, fromEventPattern } from "rxjs";
import fs from "fs-extra";

import { ChildProcess, execFile } from "child_process";
import { observableDolphinProcess, DolphinPlaybackInfo } from "./playback";
import { DolphinEntry, DolphinQueueFormat } from "../utils/dolphin";
import { tap, switchMap, map, takeUntil } from "rxjs/operators";
import { Frames } from "slp-parser-js";

const MAX_BUFFER = 2 ** 20;
const DELAY_AMOUNT_MS = 1000;

const START_RECORDING_BUFFER = 90;
const END_RECORDING_BUFFER = -60;

interface IDolphinPlayer {
    loadJSON: () => void;
    // loadSlpFiles: (files: string[]) => void;
    commands$: Observable<any>;
    currentFile: () => string;
}

interface DolphinLauncherOptions {
    dolphinPath: string;
    meleeIsoPath: string;
    batch: boolean;
    startBuffer: number;
    endBuffer: number;
}

const defaultDolphinLauncherOptions = {
    dolphinPath: "",
    meleeIsoPath: "",
    batch: true,
    startBuffer: 1,   // Sometimes Dolphin misses the start frame so start from the following frame
    endBuffer: 1,     // Match the start frame because why not
}

export interface GamePlaybackEndPayload {
    gameEnded: boolean;
}

export class DolphinLauncher {
    private options: DolphinLauncherOptions;
    private dolphin: ChildProcess | null = null;
    private waitForGAME = false;
    private currentFrame = -124;
    private lastGameFrame = -124;
    private startRecordingFrame = -124;
    private endRecordingFrame = -124;

    private currentSlpFileSource = new ReplaySubject<string>();
    private currentJSONFileSource = new ReplaySubject<string>();
    private gameStartSource = new ReplaySubject<DolphinEntry>();
    private gameEndSource = new ReplaySubject<GamePlaybackEndPayload>();

    public gameStart$ = this.gameStartSource.asObservable();
    public gameEnd$ = this.gameEndSource.asObservable();
    public currentJSONFile$: Observable<{
        filename: string;
        contents: DolphinQueueFormat;
    }>;
    public dolphinPlaybackCommands$: Observable<DolphinPlaybackInfo>;

    public constructor(options: Partial<DolphinLauncherOptions>) {
        this.options = Object.assign({}, defaultDolphinLauncherOptions, options);

        /*
        this.currentJSONFile$ = this.currentJSONFileSource.pipe(
            switchMap(filename => from<Promise<DolphinQueueFormat>>(fs.readJSON(filename)).pipe(
                map(contents => ({
                    filename,
                    contents,
                })),
            )),
        );
        */
    }

    public loadJSON(comboFilePath: string) {
        this._resetState();
        // this.currentJSONFileSource.next(comboFilePath);
        this.dolphin = this._executeFile(comboFilePath);
        if (this.dolphin.stdout) {
            const dolphin$ = observableDolphinProcess(this.dolphin.stdout);
            // This observable returns the exit code
            const finished$ = fromEventPattern<number>(
                handler => this.dolphin.addListener("close", handler),
                handler => this.dolphin.removeListener("close", handler),
            );
            dolphin$.pipe(
                // Stop emitting on process close
                takeUntil(finished$),
            ).subscribe(payload => {
                const value = parseInt(payload.value);
                switch (payload.command) {
                    case "[CURRENT_FRAME]":
                        this._handleCurrentFrame(value);
                        break;
                    case "[PLAYBACK_START_FRAME]":
                        this._handlePlaybackStartFrame(value);
                        break;
                    case "[PLAYBACK_END_FRAME]":
                        this._handlePlaybackEndFrame(value);
                        break;
                    case "[GAME_END_FRAME]":
                        this._handleGameEndFrame(value);
                        break;
                    case "[NO_GAME]":
                        this._handleNoGame();
                        break;
                    default:
                        console.log(`Unknown command ${payload.command} with value ${payload.value}`);
                        break;
                }
            });
        }
    }

    private _executeFile(comboFilePath: string): ChildProcess {
        const params = ["-i", comboFilePath];
        if (this.options.meleeIsoPath) {
            params.push("-e", this.options.meleeIsoPath)
        }
        if (this.options.batch) {
            params.push("-b")
        }
        return execFile(this.options.dolphinPath, params, { maxBuffer: MAX_BUFFER });
    }

    /*
    private _handleRecording(dolphin: ChildProcess, shouldPause?: boolean) {
        const obsConnected = obsConnection.isConnected();
        if (!obsConnected) {
            console.error("OBS is not connected. Not recording Dolphin.");
            return;
        }
        if (dolphin.stdout) {
            dolphin.stdout.on("data", (data: string) => {
                this._handleStdoutData(data);
            });
        }
        dolphin.on("close", async () => {
            // TODO: unsubscribe from subscription
            // TODO: emit dolphin close event
        });
    }
    */

    private _handleCurrentFrame(commandValue: number) {
        this.currentFrame = commandValue;
        if (this.currentFrame === this.startRecordingFrame) {
            console.log("game start");
        } else if (this.currentFrame === this.endRecordingFrame) {
            console.log("game end");
            this.gameEndSource.next({
                gameEnded: this.waitForGAME,
            });
            this._resetState();
        }
    }

    private _handlePlaybackStartFrame(commandValue: number) {
        // Ensure the start frame is at least bigger than the intital playback start frame
        this.startRecordingFrame = Math.max(commandValue, commandValue + this.options.startBuffer);
        console.log(`StartFrame: ${this.startRecordingFrame}`);
    }

    private _handlePlaybackEndFrame(commandValue: number) {
        this.endRecordingFrame = commandValue;
        // Play the game until the end
        this.waitForGAME = this.endRecordingFrame >= this.lastGameFrame;
        // Ensure the adjusted frame is between the start and end frames
        const adjustedEndFrame = Math.max(this.startRecordingFrame, this.endRecordingFrame - this.options.endBuffer);
        this.endRecordingFrame = Math.min(adjustedEndFrame, this.lastGameFrame);
        console.log(`EndFrame: ${this.endRecordingFrame}`);
    }

    private _handleGameEndFrame(commandValue: number) {
        this.lastGameFrame = commandValue;
        console.log(`LastFrame: ${this.lastGameFrame}`);
    }

    private _handleNoGame() {
        console.log("No games remaining in queue");
        console.log("Stopping Recording");
    }

    private _resetState() {
        this.currentFrame = -124;
        this.lastGameFrame = -124;
        this.startRecordingFrame = -124;
        this.endRecordingFrame = -124;
        this.waitForGAME = false;
    }
}

/*
const dolphinPlayer = new DolphinPlayer();

export const openComboInDolphin = (filePath: string, record?: boolean) => {
    dolphinPlayer.loadJSON(filePath, { record });
};

interface DolphinPlaybackPayload {
    command: string;
    value: string;
}

const observableDolphinProcess = (dolphinStdout: Readable): Observable<DolphinPlaybackPayload> => {
    const lines$ = fromEventPattern(
        handler => dolphinStdout.addListener("data", handler),
        handler => dolphinStdout.removeListener("data", handler),
        (data: string) => data.split(os.EOL).filter(line => Boolean(line))
    );
    return lines$.pipe(
        // Split each line into its own event
        concatMap(lines => of(...lines)),
        // Split the line into chunks
        map(line => line.split(" ")),
        // We must have at least 2 chunks
        filter(chunks => chunks.length >= 2),
        // Map to the playback payload
        map(chunks => {
            const [command, value] = chunks;
            const payload: DolphinPlaybackPayload = {
                command,
                value,
            };
            return payload;
        }),
    );
};

*/