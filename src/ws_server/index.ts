import {WebSocketServer, WebSocket} from "ws";
import { UserType, currentGameType, gameType, roomType } from "./types";
import { randomUUID } from "node:crypto";


export const wsServer = new WebSocketServer( {port: 3000} );
console.log("WS server started by ws://localhost:3000/");

let users: UserType[] = [];
let rooms: roomType[] = [];
let winners: object[] = [];
let games: gameType[] = [];
let currentGame: currentGameType[] = [];

class MyWebsocket extends WebSocket {
   id: string | number;
}

wsServer.on("connection", (ws: MyWebsocket) => {

 ws.id = randomUUID();             

 ws.on("message", (message) => {

    let request= JSON.parse(message.toString());

    if (request.type === 'reg') {

        let reqDate = JSON.parse(request.data.toString());

        users.push( { name: reqDate.name, password: reqDate.password, index: ws.id } );
        // console.log(JSON.stringify(users));

        ws.send(JSON.stringify({
            type: "reg",
            data: JSON.stringify({
                  name: users[users.length-1].name,
                  index: users[users.length-1].index,
                  error: false,
                  errorText: ""
             }),
            id:0
        }));

        ws.send(JSON.stringify({
                type: "update_room",
                data: JSON.stringify(rooms),
                id:0,
        }));

        ws.send(JSON.stringify({
               type: "update_winners",
               data: JSON.stringify(winners),
               id:0,
        }));
     
    } else if (request.type == 'create_room') {
    
        let roomRandId = randomUUID();

        let userName = '';
        users.forEach(elem => {
            if (elem.index === ws.id) {
                userName = elem.name;
            }
        })

        rooms.push(
            {
                roomId: roomRandId,
                roomUsers: 
             [
                {  name: userName,
                 index: ws.id,
                }, 
          ],
        }
        )
        // console.log(JSON.stringify(rooms));

        wsServer.clients.forEach(client => {
            if (client.readyState === 1 ) {
              client.send(JSON.stringify({
              type: "update_room",
              data: JSON.stringify(rooms),
              id:0,
              }));
            }
        });
    } else if (request.type == 'add_user_to_room') {

    let gameId: { indexRoom: string } = JSON.parse(request.data.toString());

    rooms.forEach((room, ind) => {
        if (room.roomId === gameId.indexRoom) {

            games.push( { idGame: gameId.indexRoom,
                    idPlayer1: room.roomUsers[0].index,
                    idPlayer2: ws.id
                });

            rooms.splice(ind, 1);
        }
    });

    // console.log(games);

    wsServer.clients.forEach(client => { //обновили список комнат, удалив активную, и всем разослали
        client.send(JSON.stringify({
        type: "update_room",
        data: JSON.stringify(rooms),
        id:0,
        }));
    });
   
    wsServer.clients.forEach(client => {   //отправляем create_game 'правильным' игрокам
    
        for (let key in client ) {
            if (key === 'id') {

        games.forEach(elem => {
            if (gameId.indexRoom === elem.idGame) {
                if ( client[key] === elem.idPlayer1 ) {
                    client.send(JSON.stringify({
                    type: "create_game",
                    data: JSON.stringify({ idGame: gameId.indexRoom, idPlayer: client[key] } ),
                    id:0,
                    }));
                } else if ( client[key] === elem.idPlayer2 ) {
                          client.send(JSON.stringify({
                          type: "create_game",
                          data: JSON.stringify({ idGame: gameId.indexRoom, idPlayer: client[key] } ),
                          id:0,
                    }));
                } 
            }
        })
        }
        }
      })
    } else if (request.type === 'add_ships') {

        let shipsData = JSON.parse(request.data.toString());
        currentGame.push(shipsData);
         console.log(currentGame);

         wsServer.clients.forEach(client => {   //отправляем start_game 'правильным' игрокам
    
            for (let key in client ) {
                if (key === 'id') {
    
            currentGame.forEach(elem => {
                if ( client[key] === elem.indexPlayer) {
                        client.send(JSON.stringify({
                        type: "start_game",
                        data: JSON.stringify({ ships: elem.ships, currentPlayerIndex: elem.indexPlayer } ),
                        id:0,
                        }));
                    } 
                })
            }
            }
          })
     }
      
        
    
    })


});

