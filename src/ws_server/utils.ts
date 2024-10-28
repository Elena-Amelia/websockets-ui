import { CurrentGameType } from "./types";

export function isArrIncludesTwice(
  arr: CurrentGameType[],
  id: string | number
) {
  let result = arr.filter((arrShips) => arrShips.gameId === id);
  if (result.length === 2) return true;
}

export function cleanArr(arr, id) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].gameId === id || arr[i].idGame === id) {
      arr.splice(i, 1);
      i--;
    }
  }
}
