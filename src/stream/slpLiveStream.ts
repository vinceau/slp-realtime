import { RxSlpStream } from "./rxSlpStream";
import { Connection, ConsoleConnection, DolphinConnection, ConnectionStatus, ConnectionEvent } from "@slippi/slippi-js";

// Re-export these for ease-of-use
export { ConnectionEvent, ConsoleConnection, ConnectionStatus } from "@slippi/slippi-js";

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
  public connection: Connection;

  constructor(connectionType?: "dolphin" | "console") {
    super();
    if (connectionType === "dolphin") {
      this.connection = new DolphinConnection();
    } else {
      this.connection = new ConsoleConnection();
    }
    this.connection.on(ConnectionEvent.HANDSHAKE, (data) => {
      this.updateSettings({ consoleNickname: data.consoleNickname });
    });
    this.connection.on(ConnectionEvent.DATA, (data) => {
      this.write(data);
    });
  }

  /**
   * Connect to a Wii or Slippi relay on the specified address and port.
   *
   * @param {string} address The address of the Wii or Slippi relay
   * @param {number} port The port of the Wii or Slippi relay
   * @returns {Promise<void>}
   * @memberof SlpLiveStream
   */
  public async start(address: string, port: number): Promise<void> {
    const assertConnected: Promise<void> = new Promise((resolve, reject): void => {
      // Attach the statusChange handler before we initiate the connection
      const onStatusChange = (status: ConnectionStatus) => {
        // We only care about the connected and disconnected statuses
        if (status !== ConnectionStatus.CONNECTED && status !== ConnectionStatus.DISCONNECTED) {
          return;
        }
        this.connection.removeListener(ConnectionEvent.STATUS_CHANGE, onStatusChange);

        // Complete the promise
        switch (status) {
          case ConnectionStatus.CONNECTED:
            resolve();
            break;
          case ConnectionStatus.DISCONNECTED:
            reject(new Error(`Failed to connect to: ${address}:${port}`));
            break;
        }
      };
      this.connection.on(ConnectionEvent.STATUS_CHANGE, onStatusChange);

      try {
        // Actually try to connect
        this.connection.connect(address, port);
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
