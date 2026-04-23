// Re-written in TS from https://github.com/kanongil/node-tailstream
// Originally by Gil Pedersen <gpdev@gpost.dk>

import type { Stats } from "fs";
import fs from "fs";
import oncemore from "oncemore";
import type { TransformCallback } from "stream";
import { Transform } from "stream";

export interface TailStreamOptions {
  fd?: number | null;
  autoClose?: boolean;
  start?: number;
  end?: never; // explicitly unsupported
}

export class TailStream extends Transform {
  public static START_DELAY = 50; // ms

  public path: string;
  public flags: string;
  public fd: number | null;
  public autoClose: boolean;

  public closing: boolean;

  private _closed: boolean;
  private _offset: number;
  private _handle: NodeJS.ReadableStream | null;
  private _delay: number;

  public constructor(path: string, options: TailStreamOptions = {}) {
    super();

    if (options.end !== undefined) {
      throw new Error('"end" option is not supported');
    }

    this.path = path;
    this.flags = "r";
    this.fd = Object.prototype.hasOwnProperty.call(options, "fd") ? options.fd ?? null : null;
    this.autoClose = !!options.autoClose;

    this.closing = false;
    this._closed = false;

    this._offset = options.start ? ~~options.start : 0;
    this._handle = null;
    this._delay = TailStream.START_DELAY;

    this.poll();

    this.on("end", () => {
      if (this.autoClose) {
        this.destroy();
      }
    });
  }

  public _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void {
    this._offset += chunk.length;
    callback(null, chunk);
  }

  public open(): void {
    fs.open(this.path, this.flags, (err, fd) => {
      if (err) {
        if (this.autoClose) {
          this.destroy();
        }
        this.emit("error", err);
        return;
      }

      this.fd = fd;
      this.emit("open", fd);
    });
  }

  public poll(): void {
    const wasClosing: boolean = this.closing;

    const handleStat = (err: NodeJS.ErrnoException | null, stat?: Stats): void => {
      if (!err && stat && !stat.isFile()) {
        err = new Error("path does not point to a regular file");
      }

      if (err) {
        if (err.code === "ENOENT") {
          if (!this.fd) {
            doNextAction();
            return;
          }
          this.end();
          return;
        }
        doNextAction();
        return;
      }

      if (!stat) {
        doNextAction();
        return;
      }

      // file deleted
      if (stat.nlink === 0) {
        this.end();
        return;
      }

      if (!this.fd && !this._closed) {
        this.once("open", () => {
          this.fill(doNextAction);
        });
        this.open();
        return;
      }

      if (stat.size > this._offset) {
        this.fill(doNextAction);
        return;
      }

      doNextAction();
    };

    const doNextAction = (err?: Error | null): void => {
      if (err) {
        if (this.autoClose) {
          this.destroy();
        }
        this.emit("error", err);
        return;
      }

      if (wasClosing && !this.autoClose) {
        this.close(() => this.end());
        return;
      }

      this._delay = Math.min(1000, this._delay * 2);
      setTimeout(() => this.poll(), this._delay);
    };

    if (this.fd !== null) {
      fs.fstat(this.fd, handleStat);
    } else {
      fs.stat(this.path, handleStat);
    }
  }

  public fill(done: (err?: Error | null) => void): void {
    this._delay = TailStream.START_DELAY;

    const stream = fs.createReadStream(this.path, {
      fd: this.fd ?? undefined,
      autoClose: false,
      start: this._offset,
    });

    this._handle = oncemore(stream);

    this._handle?.pipe(this, { end: false });

    // oncemore has non-standard typings
    (this._handle as any).once("end", "error", (err?: Error) => {
      this._handle = null;
      done(err);
    });
  }

  public destroy(error?: Error): this {
    if (this.destroyed) {
      return this;
    }

    super.destroy(error);

    if (this.fd !== null) {
      this.close();
    }

    return this;
  }

  public close(cb?: () => void): void {
    if (cb) {
      this.once("close", cb);
    }

    if (this._closed || this.fd === null) {
      if (this.fd === null) {
        this.once("open", () => this.close());
        return;
      }
      process.nextTick(() => this.emit("close"));
      return;
    }

    this._closed = true;

    const fdToClose: number = this.fd;

    const closeFd = (fd?: number): void => {
      fs.close(fd ?? fdToClose, (err) => {
        if (err) {
          this.emit("error", err);
        } else {
          this.emit("close");
        }
      });
      this.fd = null;
    };

    closeFd();
  }

  // signal that a final size check should be made before ending
  public done(): void {
    this.closing = true;
    this._delay = TailStream.START_DELAY;
  }
}

export function createReadStream(path: string, options?: TailStreamOptions): TailStream {
  return new TailStream(path, options);
}
