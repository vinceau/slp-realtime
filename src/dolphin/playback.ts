import os from "os";
import { Observable, fromEventPattern, of } from "rxjs"; 

import { Readable } from "stream";
import { concatMap, map, filter } from "rxjs/operators";

export interface DolphinPlaybackInfo {
    command: string;
    value: string;
}

export const observableDolphinProcess = (dolphinStdout: Readable): Observable<DolphinPlaybackInfo> => {
    const lines$ = fromEventPattern(
        handler => dolphinStdout.addListener("data", handler),
        handler => dolphinStdout.removeListener("data", handler),
        (data: Buffer) => {
            const dataString = data.toString();
            return dataString.split(os.EOL).filter(line => Boolean(line))
        }
    );
    return lines$.pipe(
        // Split each line into its own event
        concatMap(lines => of(...lines)),
        // Split the line into chunks
        map(line => line.split(" ")),
        // We must have at least 2 chunks
        filter(chunks => chunks.length >= 2),
        // Map to the playback payload
        map(([command, value]) => {
            const payload: DolphinPlaybackInfo = {
                command,
                value,
            };
            return payload;
        }),
    );
};
