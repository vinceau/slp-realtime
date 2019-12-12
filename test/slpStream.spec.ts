import fs from 'fs';
import sinon from "sinon";

import { SlpStream } from '../src';

describe('SlpStream', () => {

  describe('when reading from a standard slp file', () => {
    beforeEach(() => {
      jest.setTimeout(1000000);
    });

    it('emits exactly one game start and one game end event', async () => {
      const gameStartSpy = sinon.spy();
      const gameEndSpy = sinon.spy();

      await new Promise((resolve): void => {
        const readStream = fs.createReadStream("slp/Game_20190810T162904.slp");
        const slpStream = new SlpStream({ singleGameMode: true });

        readStream.on('open', () => {
          readStream.pipe(slpStream);
        });
        readStream.on("close", () => {
          resolve();
        });

        slpStream.on("gameStart", gameStartSpy);
        slpStream.on("gameEnd", gameEndSpy);
      });

      expect(gameStartSpy.callCount).toEqual(1);
      expect(gameEndSpy.callCount).toEqual(1);
    });

  });

});
