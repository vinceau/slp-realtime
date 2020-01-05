import { SlpFileWriter, SlpFileWriterOptions } from "../utils/slpWriter";
import { ConsoleConnection, ConnectionStatus } from "@vinceau/slp-wii-connect"
import { promiseTimeout } from "../utils/sleep";
import { SlippiRealtime } from "./realtime";

// Re-export these for ease-of-use
export { ConsoleConnection, ConnectionStatus } from "@vinceau/slp-wii-connect"

const SLIPPI_CONNECTION_TIMEOUT_MS = 5000;

/**
 * Slippi Game class that wraps a read stream
 */
export class SlippiLivestream {
  public connection: ConsoleConnection;
  public events: SlippiRealtime;
  private stream: SlpFileWriter;

  public constructor() {
    this.connection = new ConsoleConnection();
    this.stream = new SlpFileWriter();
    this.events = new SlippiRealtime(this.stream);
  }

  public updateSettings(settings: Partial<SlpFileWriterOptions>): void {
    this.stream.updateSettings(settings);
  }

  public async start(address: string, port: number): Promise<void> {
    // Restart the connection if already connected
    if (this.connection !== null) {
      this.connection.disconnect();
    }

    const assertConnected: Promise<void> = new Promise((resolve, reject): void => {
      try {
        this.connection.connect(address, port, SLIPPI_CONNECTION_TIMEOUT_MS);
        this.connection.on("data", (data) => {
          this.stream.write(data);
        });
        this.connection.once("statusChange", (status: ConnectionStatus) => {
          switch (status) {
          case ConnectionStatus.CONNECTED:
            resolve();
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
    return promiseTimeout<void>(SLIPPI_CONNECTION_TIMEOUT_MS, assertConnected);
  }
}