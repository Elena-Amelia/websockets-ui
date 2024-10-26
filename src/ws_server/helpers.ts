import { CurrentGameType, GameType } from "./types";

export function isArrIncludesTwice(
  arr: CurrentGameType[],
  id: string | number
) {
  let result = arr.filter((elem) => elem.gameId === id);
  if (result.length === 2) return true;
}

export function getFirstPlayerId(
  gamesArr: GameType[],
  currGame: CurrentGameType
) {
  let firstPlayerId: string | number = "";

  gamesArr.forEach((game) => {
    if (game.idGame === currGame.gameId) {
      firstPlayerId = game.idPlayer1;
    }
  });
  return firstPlayerId;
}

export function getVictim(gamesArr: GameType[], data) {
  let player1: string | number;
  let player2: string | number;
  let victim: string | number = "";

  gamesArr.forEach((game) => {
    if (game.idGame === data.gameId) {
      player1 = game.idPlayer1;
      player2 = game.idPlayer2;
    }
    if (data.indexPlayer === player1) {
      victim = player2;
    } else if (data.indexPlayer === player2) {
      victim = player1;
    }
  });
  return victim;
}

export function isGameOver(gamesArr: GameType[], data, userShipsArr) {
  if (!gamesArr || !data || !userShipsArr) return false;
  let player1: string | number;
  let player2: string | number;
  let isPlayer1 = false,
    isPlayer2 = false;

  gamesArr.forEach((game) => {
    if (game.idGame === data.gameId) {
      player1 = game.idPlayer1;
      player2 = game.idPlayer2;
    }
  });

  userShipsArr.forEach((user) => {
    if (user.gameId === data.gameId && user.indexPlayer === player1) {
      isPlayer1 = true;
    } else if (user.gameId === data.gameId && user.indexPlayer === player2) {
      isPlayer2 = true;
    }
  });

  if (isPlayer1 && isPlayer2) {
    return true;
  } else {
    return false;
  }
}
