import os from "os";
import { Observable, fromEventPattern, from } from "rxjs";

import { Readable } from "stream";
import { concatMap, map } from "rxjs/operators";

export interface DolphinPlaybackInfo {
  command: string;
  value?: string;
}

export const observableDolphinProcess = (dolphinStdout: Readable): Observable<DolphinPlaybackInfo> => {
  // Convert the data event into an observable
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
    concatMap(lines => from(lines)),
    // Split the line into chunks
    map(line => line.split(" ")),
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
