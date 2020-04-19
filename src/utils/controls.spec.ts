import { generateInputBitmask } from "./controls";

describe("when generating input bit masks", () => {

    it("should throw on invalid inputs", async () => {
        const buttons: any[] = ["Q"];
        expect(() => generateInputBitmask(...buttons)).toThrow(/Unknown input/);
    });

});
