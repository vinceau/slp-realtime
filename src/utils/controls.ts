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

const generateInputBitmaskFromBit = (...buttons: InputBit[]): number => {
  return buttons.reduce((a, b) => (a | b));
};

export const generateInputBitmask = (...buttons: Input[]): number => {
  const mappedButtons = buttons.map(b => mapInputToBits(b));
  return generateInputBitmaskFromBit(...mappedButtons);
};

const mapInputToBits = (button: Input): InputBit => {
  switch (button) {
  case Input.D_LEFT:
    return InputBit.D_LEFT;
  case Input.D_RIGHT:
    return InputBit.D_RIGHT;
  case Input.D_DOWN:
    return InputBit.D_DOWN;
  case Input.D_UP:
    return InputBit.D_UP;
  case Input.Z:
    return InputBit.Z;
  case Input.R:
    return InputBit.R;
  case Input.L:
    return InputBit.L;
  case Input.A:
    return InputBit.A;
  case Input.B:
    return InputBit.B;
  case Input.X:
    return InputBit.X;
  case Input.Y:
    return InputBit.Y;
  case Input.START:
    return InputBit.START;
  default:
    throw new Error(`Unknown input: ${button}`);
  };
};
