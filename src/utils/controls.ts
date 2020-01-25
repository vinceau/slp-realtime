import { ControllerInput } from "../types";

export const generateControllerBitmask = (...buttons: ControllerInput[]): number => {
  return buttons.reduce((a, b) => (a | b));
}