import { WebSocketServer, WebSocket } from "ws";
import {
  UserType,
  ClientType,
  CurrentGameType,
  GameType,
  RoomType,
  ShipType,
  UserShipsType,
  ShipCoord,
  WinnersDataType,
  InvalidCeils,
} from "./types";
import { randomUUID } from "node:crypto";
import {
  getFirstPlayerId,
  isGameOver,
  getVictim,
  getNearbyCoords,
  getShotCoords,
  getAnswer,
  updateWinners,
} from "./helpers";
import { isArrIncludesTwice, cleanArr } from "./utils";

export const wsServer = new WebSocketServer({ port: 3000 });
console.log("WS server started by ws://localhost:3000/");

const users: UserType[] = [];
const clients: ClientType[] = [];
const rooms: RoomType[] = [];
const winners: WinnersDataType[] = [];
const games: GameType[] = [];
const currentGame: CurrentGameType[] = [];
const userShips: UserShipsType[] = [];
const invalidCells: InvalidCeils[] = [];

class MyWebsocket extends WebSocket {
  id: string | number;
}

wsServer.on("connection", (ws: MyWebsocket) => {
  ws.id = randomUUID();
  const wsID = ws.id;

  ws.on("message", (message) => {
    let request = JSON.parse(message.toString());

    let isFound = false;

    if (request.type === "reg") {
      const regData = JSON.parse(request.data.toString());

      clients.forEach((client) => {
        if (client.name === regData.name) {
          ws.send(
            JSON.stringify({
              type: "reg",
              data: JSON.stringify({
                name: client.name,
                index: client.index,
                error: true,
                errorText: "You are already logged in",
              }),
              id: 0,
            })
          );
          isFound = true;
          console.log(`reg: ${regData.name} is already logged in`);
        }
      });

      if (!isFound) {
        users.forEach((user, ind) => {
          if (
            user.name === regData.name &&
            user.password === regData.password
          ) {
            user.index = ws.id;

            clients.push({
              name: user.name,
              index: user.index,
            });

            ws.send(
              JSON.stringify({
                type: "reg",
                data: JSON.stringify({
                  name: users[ind].name,
                  index: users[ind].index,
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
            isFound = true;
            console.log(`reg: ${regData.name} is connected`);
          } else if (
            user.name === regData.name &&
            user.password !== regData.password
          ) {
            ws.send(
              JSON.stringify({
                type: "reg",
                data: JSON.stringify({
                  name: users[users.length - 1].name,
                  index: users[users.length - 1].index,
                  error: true,
                  errorText: "Wrong password",
                }),
                id: 0,
              })
            );
            isFound = true;
            console.log(`reg: ${regData.name} isn't connected`);
          }
        });
      }

      if (!isFound) {
        users.push({
          name: regData.name,
          password: regData.password,
          index: ws.id,
        });

        clients.push({
          name: regData.name,
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
        console.log(`reg: ${regData.name} is connected`);
      }
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
      console.log(`create_room: room ${roomRandId} is created`);
    } else if (request.type === "add_user_to_room") {
      const gameId: { indexRoom: string | number } = JSON.parse(
        request.data.toString()
      );

      rooms.forEach((room, ind) => {
        if (room.roomId === gameId.indexRoom) {
          room.roomUsers.forEach((user) => {
            //игрок не может зайти в комнату еще раз
            if (user.index === ws.id) {
              return;
            } else {
              games.push({
                idGame: gameId.indexRoom, // присвоили gameId номер комнаты
                idPlayer1: room.roomUsers[0].index, // id того, кто создал комнату
                idPlayer2: ws.id, // id того, кто добавился
              });

              rooms.splice(ind, 1); // удалили эту комнату
            }
          });

          //УДАЛЯЕМ КОМНАТЫ, С ИГРОКАМИ ЗАШЕДШИМИ В ИГРУ
          games.forEach((game) => {
            if (gameId.indexRoom === game.idGame) {
              for (let i = 0; i < rooms.length; i++) {
                if (
                  rooms[i].roomUsers[0].index === game.idPlayer1 ||
                  rooms[i].roomUsers[0].index === game.idPlayer2
                ) {
                  rooms.splice(ind, 1);
                }
                i--;
              }
            }
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

          wsServer.clients.forEach((client) => {
            // отправляем create_game 'правильным' игрокам

            for (let key in client) {
              if (key === "id") {
                games.forEach((game) => {
                  if (gameId.indexRoom === game.idGame) {
                    if (
                      client[key] === game.idPlayer1 ||
                      client[key] === game.idPlayer2
                    ) {
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
        }
      });
      console.log(`add_user_to_room: game ${gameId.indexRoom} is created`);
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
            shipCoordinate.push({
              x: x,
              y: y + i,
              length: ship.length,
            });
          } else {
            shipCoordinate.push({
              x: x + i,
              y: y,
              length: ship.length,
            }); //по горизонтали
          }
        }
        userShips.push({
          gameId: gameId,
          indexPlayer: indexPlayer,
          shipLength: shipLength,
          ships: shipCoordinate,
          direction: ship.direction,
          type: ship.type,
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

                games.forEach((game) => {
                  if (game.idGame === gameId) {
                    game.activePlayer = firstPlayerId;
                  }
                });

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
      console.log(`add_ships: ships are added, game ${gameId} is started`);
    } else if (request.type === "attack") {
      const attackData = JSON.parse(request.data.toString());

      games.forEach((game) => {
        if (game.idGame === attackData.gameId) {
          if (attackData.indexPlayer !== game.activePlayer) {
            return;
          } else {
            const ans = getAnswer(invalidCells, attackData);
            if (ans) {
              wsServer.clients.forEach((client) => {
                for (let key in client) {
                  if (key === "id") {
                    games.forEach((game) => {
                      if (game.idGame === attackData.gameId) {
                        client.send(
                          JSON.stringify({
                            type: "turn",
                            data: JSON.stringify({
                              currentPlayer: attackData.indexPlayer,
                            }),
                            id: 0,
                          })
                        );
                      }
                    });
                  }
                }
              });
            } else {
              invalidCells.push({
                x: attackData.x,
                y: attackData.y,
                player: attackData.indexPlayer,
                gameId: attackData.gameId,
              });

              const victim = getVictim(games, attackData);

              let checker = false;

              upper: for (let j = 0; j < userShips.length; j++) {
                if (
                  userShips[j].gameId === attackData.gameId && //нашли по кому стрелять
                  userShips[j].indexPlayer === victim
                ) {
                  for (let i = 0; i < userShips[j].ships.length; i++) {
                    // ПОПАЛИ
                    if (
                      userShips[j].ships[i].x === attackData.x &&
                      userShips[j].ships[i].y === attackData.y
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
                                        position: {
                                          x: attackData.x,
                                          y: attackData.y,
                                        },
                                        currentPlayer: attackData.indexPlayer,
                                        status: "shot",
                                      }),
                                      id: 0,
                                    })
                                  );

                                  client.send(
                                    JSON.stringify({
                                      type: "turn",
                                      data: JSON.stringify({
                                        currentPlayer: attackData.indexPlayer,
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
                        console.log(`attack: the ship is shot`);
                        break upper;
                      } else if (userShips[j].shipLength === 1) {
                        //УБИЛИ

                        const arrKilled = getShotCoords(userShips[j].ships);
                        const arrMissed = getNearbyCoords(userShips[j]);

                        arrMissed.forEach((elem) => {
                          invalidCells.push({
                            x: elem.x,
                            y: elem.y,
                            player: attackData.indexPlayer,
                            gameId: attackData.gameId,
                          });
                        });

                        wsServer.clients.forEach((client) => {
                          for (let key in client) {
                            if (key === "id") {
                              games.forEach((game) => {
                                if (game.idGame === userShips[j].gameId) {
                                  client.send(
                                    JSON.stringify({
                                      type: "attack",
                                      data: JSON.stringify({
                                        position: {
                                          x: attackData.x,
                                          y: attackData.y,
                                        },
                                        currentPlayer: attackData.indexPlayer,
                                        status: "killed",
                                      }),
                                      id: 0,
                                    })
                                  );

                                  arrKilled.forEach((pos) => {
                                    client.send(
                                      JSON.stringify({
                                        type: "attack",
                                        data: JSON.stringify({
                                          position: {
                                            x: pos.x,
                                            y: pos.y,
                                          },
                                          currentPlayer: attackData.indexPlayer,
                                          status: "killed",
                                        }),
                                        id: 0,
                                      })
                                    );
                                  });

                                  arrMissed.forEach((pos) => {
                                    client.send(
                                      JSON.stringify({
                                        type: "attack",
                                        data: JSON.stringify({
                                          position: {
                                            x: pos.x,
                                            y: pos.y,
                                          },
                                          currentPlayer: attackData.indexPlayer,
                                          status: "miss + killed",
                                        }),
                                        id: 0,
                                      })
                                    );
                                  });

                                  client.send(
                                    JSON.stringify({
                                      type: "turn",
                                      data: JSON.stringify({
                                        currentPlayer: attackData.indexPlayer,
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
                        console.log(`attack: the ship is killed`);
                        //проверка на окончание игры
                        const gameOver = isGameOver(
                          games,
                          attackData,
                          userShips
                        );
                        if (gameOver) {
                          updateWinners(users, attackData.indexPlayer, winners);

                          console.log(
                            `attack: game over, the winner is ${attackData.indexPlayer}`
                          );

                          wsServer.clients.forEach((client) => {
                            for (let key in client) {
                              if (key === "id") {
                                games.forEach((game) => {
                                  if (game.idGame === attackData.gameId) {
                                    if (
                                      client[key] === game.idPlayer1 ||
                                      client[key] === game.idPlayer2
                                    ) {
                                      client.send(
                                        JSON.stringify({
                                          type: "finish",
                                          data: JSON.stringify({
                                            winPlayer: attackData.indexPlayer,
                                          }),
                                          id: 0,
                                        })
                                      );
                                    }
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
                          cleanArr(games, attackData.gameId);
                          //УДАЛИЛИ В GURRENT GAMES
                          cleanArr(currentGame, attackData.gameId);
                          //УДАЛИЛИ В USERSHIPS
                          cleanArr(userShips, attackData.gameId);
                          cleanArr(invalidCells, attackData.gameId);
                        }

                        checker = true;
                        break upper;
                      }
                    }
                  }
                }
              }

              if (checker === false) {
                //НЕ ПОПАЛИ
                wsServer.clients.forEach((client) => {
                  for (let key in client) {
                    if (key === "id") {
                      games.forEach((game) => {
                        if (game.idGame === attackData.gameId) {
                          game.activePlayer = victim;
                          client.send(
                            JSON.stringify({
                              type: "attack",
                              data: JSON.stringify({
                                position: {
                                  x: attackData.x,
                                  y: attackData.y,
                                },
                                currentPlayer: attackData.indexPlayer,
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
                console.log(`attack: ship isn't hit`);
              }
            }
          }
        }
      });
    } else if (request.type === "randomAttack") {
      const randAttackData = JSON.parse(request.data.toString());
    }
  });

  ws.on("close", (ws: MyWebsocket) => {
    clients.forEach((client, ind) => {
      if (client.index === wsID) {
        console.log(`disconnect: ${client.name} is disconnected`);

        //удаляем комнаты с ушедшим игроком

        for (let i = 0; i < rooms.length; i++) {
          if (rooms[i].roomUsers[0].name === client.name) {
            rooms.splice(ind, 1);
            i--;
          }
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
        }

        //УДАЛЯЕМ ИГРЫ С УШЕДШИМ ИГРОКОМ И ОТСЫЛАЕМ WIN ОСТАВШЕМУСЯ

        let luckyWinner: number | string = "";
        let luckyGameInd: number = 0;

        games.forEach((game, ind) => {
          if (game.idPlayer1 === client.index) {
            luckyWinner = game.idPlayer2;
            updateWinners(users, luckyWinner, winners);
            luckyGameInd = ind;
            wsServer.clients.forEach((client) => {
              for (let key in client) {
                if (key === "id") {
                  if (client[key] === luckyWinner) {
                    currentGame.forEach((currGame) => {
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
                      }
                    });

                    client.send(
                      JSON.stringify({
                        type: "finish",
                        data: JSON.stringify({
                          winPlayer: luckyWinner,
                        }),
                        id: 0,
                      })
                    );
                  }

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
          } else if (game.idPlayer2 === client.index) {
            luckyWinner = game.idPlayer1;
            updateWinners(users, luckyWinner, winners);
            luckyGameInd = ind;

            wsServer.clients.forEach((client) => {
              for (let key in client) {
                if (key === "id") {
                  if (client[key] === luckyWinner) {
                    currentGame.forEach((currGame) => {
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
                      }
                    });

                    client.send(
                      JSON.stringify({
                        type: "finish",
                        data: JSON.stringify({
                          winPlayer: luckyWinner,
                        }),
                        id: 0,
                      })
                    );
                  }

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
          }
        });

        games.splice(luckyGameInd, 1);
        clients.splice(ind, 1);
      }
    });
  });
});
