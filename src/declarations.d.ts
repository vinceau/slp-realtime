declare module "tailstream" {
  import { Readable } from "stream";

  export interface TailStream extends Readable {
    done(): void;
  }

  const defaultTailStreamExport: {
    createReadStream(filePath: string): TailStream;
  };

  export default defaultTailStreamExport;
}
