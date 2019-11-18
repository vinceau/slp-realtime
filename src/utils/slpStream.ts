import EventEmitter from "events";
import { Writable } from "stream";

import { Command, parseMessage } from "slp-parser-js";


export enum SlpEvent {
  MESSAGE_SIZES = "messageSizes",
  RAW_COMMAND = "command",
  GAME_START = "gameStart",
  PRE_FRAME_UPDATE = "preFrameUpdate",
  POST_FRAME_UPDATE = "postFrameUpdate",
  GAME_END = "gameEnd",
}

const NETWORK_MESSAGE = "HELO\0";

export class SlpStream extends Writable implements EventEmitter {
  private payloadSizes = new Map<Command, number>();
  private previousBuffer: Uint8Array = Buffer.from([]);

  public _write(newData: Buffer, encoding: string, callback: (error?: Error | null, data?: any) => void): void {
    if (encoding !== "buffer") {
      throw new Error(`Unsupported stream encoding. Expected 'buffer' got '${encoding}'.`);
    }

    // Join the current data with the old data
    const data = Uint8Array.from(Buffer.concat([
      this.previousBuffer,
      newData,
    ]));

    // Clear previous data
    this.previousBuffer = Buffer.from([]);

    const dataView = new DataView(data.buffer);

    // Iterate through the data
    let index = 0;
    while (index < data.length) {
      // We want to filter out the network messages
      if (Buffer.from(data.slice(index, index + 5)).toString() === NETWORK_MESSAGE) {
        index += 5;
        continue;
      }

      // Make sure we have enough data to read a full payload
      const command = dataView.getUint8(index);
      const payloadSize = this.payloadSizes.get(command) || 0;
      const remainingLen = data.length - index;
      if (remainingLen < payloadSize + 1) {
        // If remaining length is not long enough for full payload, save the remaining
        // data until we receive more data. The data has been split up.
        this.previousBuffer = data.slice(index);
        break;
      }

      // Increment by one for the command byte
      index += 1;

      const payloadPtr = data.slice(index);
      const payloadDataView = new DataView(data.buffer, index);
      const payloadLen = this._processCommand(command, payloadPtr, payloadDataView);
      index += payloadLen;
    }

    callback();
  }

  private _writeCommand(command: Command, entirePayload: Uint8Array, payloadSize: number): Uint8Array {
    const payloadBuf = entirePayload.slice(0, payloadSize);
    const bufToWrite = Buffer.concat([
      Buffer.from([command]),
      payloadBuf,
    ]);
    // Forward the data onwards
    this.emit(SlpEvent.RAW_COMMAND, command, bufToWrite);
    return new Uint8Array(bufToWrite);
  }

  private _processCommand(command: Command, entirePayload: Uint8Array, dataView: DataView): number {
    // Handle the message size command
    if (command === Command.MESSAGE_SIZES) {
      const payloadSize =  this._processReceiveCommands(dataView);
      // Emit the message size event
      this.emit(SlpEvent.MESSAGE_SIZES, command, this.payloadSizes);
      // Emit the raw command event
      this._writeCommand(command, entirePayload, payloadSize);
      return payloadSize;
    }

    const payloadSize = this.payloadSizes.get(command);
    if (!payloadSize) {
      // TODO: Flag some kind of error
      return 0;
    }

    // Fetch the payload and parse it
    const payload = this._writeCommand(command, entirePayload, payloadSize);
    const parsedPayload = parseMessage(command, payload);
    if (!parsedPayload) {
      // Failed to parse
      return;
    }

    switch (command) {
    case Command.GAME_START:
      console.log("slp stream game start");
      this.emit(SlpEvent.GAME_START, command, parsedPayload);
      break;
    case Command.GAME_END:
      console.log("slp stream game end");
      this.emit(SlpEvent.GAME_END, command, parsedPayload);
      break;
    case Command.PRE_FRAME_UPDATE:
      this.emit(SlpEvent.PRE_FRAME_UPDATE, command, parsedPayload);
      break;
    case Command.POST_FRAME_UPDATE:
      this.emit(SlpEvent.POST_FRAME_UPDATE, command, parsedPayload);
      break;
    default:
      break;
    }
    return payloadSize;
  }

  private _processReceiveCommands(dataView: DataView): number {
    const payloadLen = dataView.getUint8(0);
    for (let i = 1; i < payloadLen; i += 3) {
      const commandByte = dataView.getUint8(i);
      const payloadSize = dataView.getUint16(i + 1);
      this.payloadSizes.set(commandByte, payloadSize);
    }
    return payloadLen;
  }

}
