import { SlippiRealtime } from './realtime/realtime';

export * from './melee/characters';
export * from './melee/moves';
export * from './melee/stages';
export * from "./utils/slpStream"

const r = new SlippiRealtime({
  address: "0.0.0.0",
  port: 1667,
  writeSlpFiles: false,
  writeSlpFileLocation: ".",
});

r.on("gameStart", () => {
  console.log("game started");
});
r.on("gameEnd", () => {
  console.log("game ended");
});

r.on('spawn', () => {
  console.log('spawn');
});
r.on('death', () => {
  console.log('death');
});
r.on("comboStart", () => {
  console.log("comboStart");
});
r.on("comboExtend", () => {
  console.log("comboExtend");
});
r.on("comboEnd", () => {
  console.log("comboEnd");
});

r.start();