export type UserType = {
    name: string;
    password: string;
    index: string | number;
   }

export type responseType = {
        type: string;
        data: regDataType;
        id: number;
}

export type regDataType = {
    name: string;
    password: string;
}

export type RoomType = {
        roomId: string | number;
        roomUsers: RoomUsersType[];
   }

   type RoomUsersType = {
    name: string;
    index: string | number;
   }

export type GameType = {
    idGame: string | number;
    idPlayer1: string | number;
    idPlayer2: string | number;
}

export type CurrentGameType = {
    gameId: string | number;
    ships: ShipType[];
    indexPlayer: string | number;
}

export type UserShipsType = {
    ships: ShipCoord[];
    shipLength: number;
    gameId: string | number;
    indexPlayer: string | number;
}
export type ShipCoord = {
    x: number;
    y: number;
}
   export type ShipType = {
    position: { x: number;
        y: number; };
    
    direction: boolean;
    type: string;
    length: number;
   }

   export type WinnersDataType = {
        name: string;
        wins: number;

   }

