import { Stage, stages as stageUtils } from "@slippi/slippi-js";

export { Stage } from "@slippi/slippi-js";

export interface StageInfo {
  id: Stage;
  name: string;
  shortName?: string;
}

const shortNames = new Map<Stage, string>()
  .set(Stage.FOUNTAIN_OF_DREAMS, "FoD")
  .set(Stage.POKEMON_STADIUM, "PS")
  .set(Stage.YOSHIS_STORY, "YS")
  .set(Stage.DREAMLAND, "DL")
  .set(Stage.BATTLEFIELD, "BF")
  .set(Stage.FINAL_DESTINATION, "FD");

export function getStageInfo(stageId: number): StageInfo {
  const s = stageUtils.getStageInfo(stageId);
  if (!s) {
    throw new Error(`Invalid stage with id ${stageId}`);
  }
  const shortName = shortNames.get(stageId);
  return {
    ...s,
    shortName,
  };
}

export function getStageName(stageId: number): string {
  const stage = getStageInfo(stageId);
  return stage.name;
}

export function getStageShortName(stageId: number): string {
  const stage = getStageInfo(stageId);
  return stage.shortName || getStageName(stageId);
}
