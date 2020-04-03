import { Input } from "../types";

enum InputBit {
  D_LEFT = 0x0001,
  D_RIGHT = 0x0002,
  D_DOWN = 0x0004,
  D_UP = 0x0008,
  Z = 0x0010,
  R = 0x0020,
  L = 0x0040,
  A = 0x0100,
  B = 0x0200,
  X = 0x0400,
  Y = 0x0800,
  START = 0x1000,
};

const inputBitMap = new Map<Input, InputBit>()
  .set(Input.D_LEFT, InputBit.D_LEFT)
  .set(Input.D_RIGHT, InputBit.D_RIGHT)
  .set(Input.D_DOWN, InputBit.D_DOWN)
  .set(Input.D_UP, InputBit.D_UP)
  .set(Input.Z, InputBit.Z)
  .set(Input.R, InputBit.R)
  .set(Input.L, InputBit.L)
  .set(Input.A, InputBit.A)
  .set(Input.B, InputBit.B)
  .set(Input.X, InputBit.X)
  .set(Input.Y, InputBit.Y)
  .set(Input.START, InputBit.START);

const generateInputBitmaskFromBit = (...buttons: InputBit[]): number => {
  return buttons.reduce((a, b) => (a | b));
};

export const generateInputBitmask = (...buttons: Input[]): number => {
  const mappedButtons = buttons.map(b => mapInputToBits(b));
  return generateInputBitmaskFromBit(...mappedButtons);
};

const mapInputToBits = (button: Input): InputBit => {
  const b = inputBitMap.get(button);
  if (!b) {
    throw new Error(`Unknown input: ${button}`);
  }
  return b;
};
