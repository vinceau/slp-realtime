import { RxSlpStream } from "./slpStream";
import { ConsoleConnection, ConnectionStatus } from "@slippi/slippi-js";

// Re-export these for ease-of-use
export { ConsoleConnection, ConnectionStatus } from "@slippi/slippi-js";

const SLIPPI_CONNECTION_TIMEOUT_MS = 5000;

/**
 * SlpLiveStream connects to a Wii or Slippi relay and parses all the data
 * and emits SlpStream events.
 *
 * @export
 * @class SlpLiveStream
 * @extends {SlpFileWriter}
 */
export class SlpLiveStream extends RxSlpStream {
  /**
   * Connection can be used to return the connection status.
   *
   * @memberof SlpLiveStream
   */
  public connection = new ConsoleConnection();

  /**
   * Connect to a Wii or Slippi relay on the specified address and port.
   *
   * @param {string} address The address of the Wii or Slippi relay
   * @param {number} port The port of the Wii or Slippi relay
   * @returns {Promise<void>}
   * @memberof SlpLiveStream
   */
  public async start(address: string, port: number): Promise<void> {
    // Restart the connection if already connected
    if (this.connection !== null) {
      this.connection.disconnect();
    }

    const assertConnected: Promise<void> = new Promise((resolve, reject): void => {
      try {
        this.connection.connect(address, port, SLIPPI_CONNECTION_TIMEOUT_MS);
        this.connection.on("handshake", (data) => {
          this.updateSettings({ consoleNickname: data.consoleNickname });
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

/**
 * Returns either the promise resolved or a rejection after a specified timeout.
 */
const promiseTimeout = <T>(ms: number, promise: Promise<T>): Promise<T> => {
  // Create a promise that rejects in <ms> milliseconds
  const timeout = new Promise((resolve, reject): void => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(`Timed out after ${ms}ms.`));
    }, ms);
  });

  // Returns a race between our timeout and the passed in promise
  return Promise.race([promise, timeout]) as Promise<T>;
};
