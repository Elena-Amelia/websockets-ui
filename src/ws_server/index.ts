import { WebSocketServer, WebSocket } from "ws";
import {
  UserType,
  CurrentGameType,
  GameType,
  RoomType,
  ShipType,
  UserShipsType,
  ShipCoord,
  WinnersDataType,
} from "./types";
import { randomUUID } from "node:crypto";
import {
  isArrIncludesTwice,
  getFirstPlayerId,
  isGameOver,
  getVictim,
} from "./helpers";

export const wsServer = new WebSocketServer({ port: 3000 });
console.log("WS server started by ws://localhost:3000/");

let users: UserType[] = [];
let rooms: RoomType[] = [];
let winners: WinnersDataType[] = [];
let games: GameType[] = [];
let currentGame: CurrentGameType[] = [];
let userShips: UserShipsType[] = []; //СВОИ КОРАБЛИ, РАСПИСАННЫЕ ПО КЛЕТОЧКАМ

class MyWebsocket extends WebSocket {
  id: string | number;
}

wsServer.on("connection", (ws: MyWebsocket) => {
  ws.id = randomUUID();

  ws.on("message", (message) => {
    let request = JSON.parse(message.toString());

    if (request.type === "reg") {
      const regData = JSON.parse(request.data.toString());

      users.push({
        name: regData.name,
        password: regData.password,
        index: ws.id,
      });

      ws.send(
        JSON.stringify({
          type: "reg",
          data: JSON.stringify({
            name: users[users.length - 1].name,
            index: users[users.length - 1].index,
            error: false,
            errorText: "",
          }),
          id: 0,
        })
      );

      ws.send(
        JSON.stringify({
          type: "update_room",
          data: JSON.stringify(rooms),
          id: 0,
        })
      );

      ws.send(
        JSON.stringify({
          type: "update_winners",
          data: JSON.stringify(winners),
          id: 0,
        })
      );
    } else if (request.type === "create_room") {
      const roomRandId = randomUUID();

      let userName = "";
      users.forEach((user) => {
        if (user.index === ws.id) {
          userName = user.name;
        }
      });

      rooms.push({
        roomId: roomRandId,
        roomUsers: [
          {
            name: userName,
            index: ws.id,
          },
        ],
      });

      wsServer.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(
            JSON.stringify({
              type: "update_room",
              data: JSON.stringify(rooms),
              id: 0,
            })
          );
        }
      });
    } else if (request.type === "add_user_to_room") {
      const gameId: { indexRoom: string | number } = JSON.parse(
        request.data.toString()
      );

      rooms.forEach((room, ind) => {
        if (room.roomId === gameId.indexRoom) {
          games.push({
            idGame: gameId.indexRoom, // присвоили gameId номер комнаты
            idPlayer1: room.roomUsers[0].index, // id того, кто создал комнату
            idPlayer2: ws.id, // id того, кто добавился
          });

          rooms.splice(ind, 1); // удалили эту комнату
        }
      });

      wsServer.clients.forEach((client) => {
        // обновили список комнат, удалив активную, и всем разослали
        client.send(
          JSON.stringify({
            type: "update_room",
            data: JSON.stringify(rooms),
            id: 0,
          })
        );
      });

      wsServer.clients.forEach((client) => {
        // отправляем create_game 'правильным' игрокам

        for (let key in client) {
          if (key === "id") {
            games.forEach((game) => {
              if (gameId.indexRoom === game.idGame) {
                if (client[key] === game.idPlayer1) {
                  client.send(
                    JSON.stringify({
                      type: "create_game",
                      data: JSON.stringify({
                        idGame: gameId.indexRoom,
                        idPlayer: client[key],
                      }),
                      id: 0,
                    })
                  );
                } else if (client[key] === game.idPlayer2) {
                  client.send(
                    JSON.stringify({
                      type: "create_game",
                      data: JSON.stringify({
                        idGame: gameId.indexRoom,
                        idPlayer: client[key],
                      }),
                      id: 0,
                    })
                  );
                }
              }
            });
          }
        }
      });
    } else if (request.type === "add_ships") {
      const shipsData = JSON.parse(request.data.toString());

      currentGame.push(shipsData);

      // парсим корабли, чтобы в них было удобно стрелять

      const gameId = shipsData.gameId;
      const indexPlayer = shipsData.indexPlayer;

      shipsData.ships.forEach((ship: ShipType) => {
        let x = ship.position.x;
        let y = ship.position.y;
        const shipLength = ship.length;
        const shipCoordinate: ShipCoord[] = [];

        for (let i = 0; i < shipLength; i++) {
          if (ship.direction === true) {
            //по вертикали
            shipCoordinate.push({ x: x, y: y + i });
          } else {
            shipCoordinate.push({ x: x + i, y: y }); //по горизонтали
          }
        }
        userShips.push({
          gameId: gameId,
          indexPlayer: indexPlayer,
          shipLength: shipLength,
          ships: shipCoordinate,
        });
      });

      // отправляем start_game 'правильным' игрокам
      wsServer.clients.forEach((client) => {
        for (let key in client) {
          if (key === "id") {
            currentGame.forEach((currGame) => {
              // если оба игрока расставили корабли
              if (isArrIncludesTwice(currentGame, currGame.gameId)) {
                //ищем первого игрока

                const firstPlayerId = getFirstPlayerId(games, currGame);

                if (client[key] === currGame.indexPlayer) {
                  client.send(
                    JSON.stringify({
                      type: "start_game",
                      data: JSON.stringify({
                        ships: currGame.ships,
                        currentPlayerIndex: currGame.indexPlayer,
                      }),
                      id: 0,
                    })
                  );

                  client.send(
                    JSON.stringify({
                      type: "turn",
                      data: JSON.stringify({ currentPlayer: firstPlayerId }),
                      id: 0,
                    })
                  );
                }
              }
            });
          }
        }
      });
    } else if (request.type === "attack") {
      const attackDate = JSON.parse(request.data.toString());

      const victim = getVictim(games, attackDate);
      let checker = false;

      upper: for (let j = 0; j < userShips.length; j++) {
        if (
          userShips[j].gameId === attackDate.gameId && //нашли по кому стрелять
          userShips[j].indexPlayer === victim
        ) {
          for (let i = 0; i < userShips[j].ships.length; i++) {
            // ПОПАЛИ
            if (
              userShips[j].ships[i].x === attackDate.x &&
              userShips[j].ships[i].y === attackDate.y
            ) {
              if (userShips[j].shipLength > 1) {
                userShips[j].shipLength--;

                wsServer.clients.forEach((client) => {
                  for (let key in client) {
                    if (key === "id") {
                      games.forEach((game) => {
                        if (game.idGame === userShips[j].gameId) {
                          client.send(
                            JSON.stringify({
                              type: "attack",
                              data: JSON.stringify({
                                position: { x: attackDate.x, y: attackDate.y },
                                currentPlayer: attackDate.indexPlayer,
                                status: "shot",
                              }),
                              id: 0,
                            })
                          );

                          client.send(
                            JSON.stringify({
                              type: "turn",
                              data: JSON.stringify({
                                currentPlayer: attackDate.indexPlayer,
                              }),
                              id: 0,
                            })
                          );
                        }
                      });
                    }
                  }
                });
                checker = true;
                break upper;
              } else if (userShips[j].shipLength === 1) {
                wsServer.clients.forEach((client) => {
                  for (let key in client) {
                    if (key === "id") {
                      games.forEach((game) => {
                        if (game.idGame === userShips[j].gameId) {
                          client.send(
                            JSON.stringify({
                              type: "attack",
                              data: JSON.stringify({
                                position: { x: attackDate.x, y: attackDate.y },
                                currentPlayer: attackDate.indexPlayer,
                                status: "killed",
                              }),
                              id: 0,
                            })
                          );

                          client.send(
                            JSON.stringify({
                              type: "turn",
                              data: JSON.stringify({
                                currentPlayer: attackDate.indexPlayer,
                              }),
                              id: 0,
                            })
                          );
                        }
                      });
                    }
                  }
                });

                const ind = userShips.findIndex(
                  (elem) => elem === userShips[j]
                );
                userShips.splice(ind, 1);

                //проверка на окончание игры
                const gameOver = isGameOver(games, attackDate, userShips);
                if (!gameOver) {
                  let wins = 1; //обновили победы
                  winners.forEach((winner) => {
                    if (winner.name === attackDate.indexPlayer) {
                      wins = winner.wins;
                    }
                  });

                  winners.push({
                    name: attackDate.indexPlayer,
                    wins: wins++,
                  });

                  wsServer.clients.forEach((client) => {
                    for (let key in client) {
                      if (key === "id") {
                        games.forEach((game) => {
                          if (game.idGame === attackDate.gameId) {
                            client.send(
                              JSON.stringify({
                                type: "finish",
                                data: JSON.stringify({
                                  winPlayer: attackDate.indexPlayer,
                                }),
                                id: 0,
                              })
                            );
                          }
                        });

                        client.send(
                          JSON.stringify({
                            type: "update_winners",
                            data: JSON.stringify(winners),
                            id: 0,
                          })
                        );
                      }
                    }
                  });
                  //УДАЛИЛИ ИГРУ
                  const indexGame = games.findIndex(
                    (elem) => elem.idGame === attackDate.gameId
                  );
                  games.splice(indexGame, 1);
                  //УДАЛИЛИ В GURRENT GAMES

                  for (let i = 0; i < currentGame.length; i++) {
                    if (currentGame[i].gameId === attackDate.gameId) {
                      currentGame.splice(i, 1);
                      i--;
                    }
                  }

                  //УДАЛИЛИ В USERSHIPS

                  for (let i = 0; i < userShips.length; i++) {
                    if (userShips[i].gameId === attackDate.gameId) {
                      userShips.splice(i, 1);
                      i--;
                    }
                  }
                }

                checker = true;
                break upper;
              }
            }
          }
        }
      }

      if (checker === false) {
        wsServer.clients.forEach((client) => {
          for (let key in client) {
            if (key === "id") {
              games.forEach((game) => {
                if (game.idGame === attackDate.gameId) {
                  client.send(
                    JSON.stringify({
                      type: "attack",
                      data: JSON.stringify({
                        position: { x: attackDate.x, y: attackDate.y },
                        currentPlayer: attackDate.indexPlayer,
                        status: "miss",
                      }),
                      id: 0,
                    })
                  );

                  client.send(
                    JSON.stringify({
                      type: "turn",
                      data: JSON.stringify({ currentPlayer: victim }),
                      id: 0,
                    })
                  );
                }
              });
            }
          }
        });
      }
    }
  });
});
