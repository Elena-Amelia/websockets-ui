import {WebSocketServer, WebSocket} from "ws";
import { UserType } from "./types";
import { randomUUID } from "node:crypto";

export const wsServer = new WebSocketServer( {port: 3000} );
console.log("WS server started by ws://localhost:3000/");

let users: UserType[] = [];
let rooms: object[] = [];
let winners: object[] = [];

class MyWebsocket extends WebSocket {
   id: string | number;
}

wsServer.on("connection", (ws: MyWebsocket) => {

 ws.id = randomUUID();

 ws.on("message", (message) => {

    if (!message) { throw new Error('No mess!') };

    let request= JSON.parse(message.toString());

    if (request.type == 'reg') {

        let reqDate = JSON.parse(request.data.toString());

        users.push( { name: reqDate.name, password: reqDate.password, index: ws.id } );
        console.log(JSON.stringify(users));

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
        console.log(JSON.stringify(rooms));

        ws.send(JSON.stringify({
            type: "update_room",
            data: JSON.stringify(rooms),
            id:0,
        }));
    }
   
})
});

