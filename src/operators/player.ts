import { EventManagerVariables } from "../manager";
import { MonoTypeOperatorFunction, Observable } from "rxjs";
import { filter } from "rxjs/operators";

const ALL_PLAYER_INDICES = [0, 1, 2, 3];

export function playerFilter<T extends { playerIndex: number }>(
  indices: number | number[] | string,
  variables?: EventManagerVariables,
): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>): Observable<T> => source.pipe(
    filter((payload) => playerFilterMatches(payload.playerIndex, indices, variables)),
  );
}

export const playerFilterMatches = (
  playerIndex: number,
  indices: number | number[] | string,
  variables?: EventManagerVariables,
): boolean => {
  // Default to all the indices
  let filterIndices: number[] = [ ...ALL_PLAYER_INDICES ];
  if (typeof indices === "number") {
    filterIndices = [indices];
  } else if (typeof indices === "string") {
    if (variables && variables.playerIndex !== undefined) {
      switch (indices) {
      case "player":
        filterIndices = [variables.playerIndex];
        break;
      case "opponents":
        filterIndices = ALL_PLAYER_INDICES.filter(n => n !== variables.playerIndex);
        break;
      }
    }
  } else {
    // indices is an array of numbers
    filterIndices = indices;
  }
  return filterIndices.includes(playerIndex);
};

