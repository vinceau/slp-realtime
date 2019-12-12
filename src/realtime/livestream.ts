import { SlpFileWriter, SlpFileWriterOptions } from "../utils/slpWriter";
import { ConsoleConnection, ConnectionStatus } from "@vinceau/slp-wii-connect"
import { promiseTimeout } from "../utils/sleep";
import { SlippiRealtime } from "./realtime";

const SLIPPI_CONNECTION_TIMEOUT_MS = 5000;

/**
 * Slippi Game class that wraps a read stream
 */
export class SlippiLivestream extends SlippiRealtime {
  private connection: ConsoleConnection | null = null;

  public constructor() {
    super(new SlpFileWriter());
  }

  public updateSettings(settings: Partial<SlpFileWriterOptions>): void {
    (this.stream as SlpFileWriter).updateSettings(settings);
  }

  public async start(address: string, port: number): Promise<boolean> {
    if (this.connection !== null) {
      this.connection.disconnect();
      this.connection = null;
    }

    const assertConnected = new Promise<boolean>((resolve, reject): void => {
      try {
        this.connection = new ConsoleConnection(address, port);
        this.connection.connect(SLIPPI_CONNECTION_TIMEOUT_MS);
        this.connection.on("data", (data) => {
          this.stream.write(data);
        });
        this.connection.on("statusChange", (status: ConnectionStatus) => {
          // this.emit("statusChange", status);
          console.log(`status changed: ${status}`);
        });
        this.connection.once("statusChange", (status: ConnectionStatus) => {
          switch (status) {
          case ConnectionStatus.CONNECTED:
            resolve(true);
            break;
          case ConnectionStatus.DISCONNECTED:
            reject(`Failed to connect to: ${address}:${port}`);
            break;
          }
        });
      } catch (err) {
        reject(err);
      }
    });
    return promiseTimeout<boolean>(SLIPPI_CONNECTION_TIMEOUT_MS, assertConnected);
  }

  public getConnectionStatus(): ConnectionStatus {
    if (this.connection) {
      return this.connection.getStatus();
    }
    return ConnectionStatus.DISCONNECTED;
  }
}