import { SlpFileWriter, SlpFileWriterOptions } from "./slpWriter";
import { ConsoleConnection, ConnectionStatus } from "@vinceau/slp-wii-connect"
import { promiseTimeout } from "./sleep";

// Re-export these for ease-of-use
export { ConsoleConnection, ConnectionStatus } from "@vinceau/slp-wii-connect"

const SLIPPI_CONNECTION_TIMEOUT_MS = 5000;

/**
 * Slippi Game class that wraps a read stream
 */
export class SlpLiveStream extends SlpFileWriter {
  public connection: ConsoleConnection;

  public constructor(options?: Partial<SlpFileWriterOptions>) {
    super(options);
    this.connection = new ConsoleConnection();
  }

  public async start(address: string, port: number): Promise<void> {
    // Restart the connection if already connected
    if (this.connection !== null) {
      this.connection.disconnect();
    }

    const assertConnected: Promise<void> = new Promise((resolve, reject): void => {
      try {
        this.connection.connect(address, port, SLIPPI_CONNECTION_TIMEOUT_MS);
        this.connection.on("handshake", (data) => {
          this.updateSettings({ consoleNick: data.consoleNickname });
        });
        this.connection.on("data", (data) => {
          this.write(data);
        });
        this.connection.once("statusChange", (status: ConnectionStatus) => {
          switch (status) {
          case ConnectionStatus.CONNECTED:
            resolve();
            break;
          case ConnectionStatus.DISCONNECTED:
            reject(new Error(`Failed to connect to: ${address}:${port}`));
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