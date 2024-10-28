import {
  CurrentGameType,
  GameType,
  UserShipsType,
  Coord,
  ShipType,
  ShipCoord,
} from "./types";

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
    return false;
  } else {
    return true;
  }
}

export function getShotCoords(arrShips: ShipCoord[]) {
  let arrKilled: Coord[] = [];

  for (let i = 0; i < arrShips.length; i++) {
    arrKilled.push({ x: arrShips[i].x, y: arrShips[i].y });
  }
  return arrKilled;
}

export function getNearbyCoords(arr: UserShipsType) {
  let resultArr: Coord[] = [];
  const x = arr.ships[0].x;
  const y = arr.ships[0].y;

  if (arr.direction === true) {
    for (let i = -1; i <= 1; i++) {
      let x1 = x + i;
      if (x1 < 0 || x1 > 9) continue;

      for (let j = -1; j <= arr.ships.length; j++) {
        let y1 = y + j;
        if (y1 < 0 || y1 > 9) continue;

        resultArr.push({ x: x1, y: y1 });
      }
    }
  } else {
    for (let i = -1; i <= arr.ships.length; i++) {
      let x1 = x + i;
      if (x1 < 0 || x1 > 9) continue;

      for (let j = -1; j <= 1; j++) {
        let y1 = y + j;
        if (y1 < 0 || y1 > 9) continue;

        resultArr.push({ x: x1, y: y1 });
      }
    }
  }

  for (let i = 0; i < resultArr.length; i++) {
    arr.ships.forEach((ship) => {
      if (resultArr[i].x === ship.x && resultArr[i].y === ship.y) {
        resultArr.splice(i, 1);
        i--;
      }
    });
  }
  return resultArr;
}

export function getAnswer(arr, data) {
  let result;
  if (arr.length === 0) {
    result = false;
  } else {
    for (let i = 0; i < arr.length; i++) {
      if (
        arr[i].x === data.x &&
        arr[i].y === data.y &&
        arr[i].player === data.indexPlayer
      ) {
        result = true;
        break;
      } else {
        result = false;
      }
    }
  }
  return result;
}

export function updateWinners(usersArr, id, winnersArr) {
  let winnerName = "";

  usersArr.forEach((user) => {
    if (user.index === id) {
      winnerName = user.name;
    }
  });

  if (winnersArr.length === 0) {
    winnersArr.push({
      name: winnerName,
      wins: 1,
    });
  } else {
    for (let i = 0; i < winnersArr.length; i++) {
      if (winnersArr[i].name === winnerName) {
        winnersArr[i].wins = winnersArr[i].wins + 1;
        break;
      } else {
        winnersArr.push({
          name: winnerName,
          wins: 1,
        });
      }
    }
  }
}
