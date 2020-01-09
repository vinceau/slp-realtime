declare module "tailstream" {
  import { Stream } from "stream";

  export interface TailStream extends Stream {
    done(): void;
  }

  const defaultTailStreamExport: {
    createReadStream(filePath: string): TailStream;
  };

  export default defaultTailStreamExport;
}
