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

export type roomType = {
        roomId: string;
        roomUsers: roomUsersType[];
   }

   type roomUsersType = {
    name: string;
    index: string | number;
   }

export   type gameType = {
    idGame: string;
    idPlayer1: string | number;
    idPlayer2: string | number;
}


   export type winnersDataType = {
        name: string;
        wins: number;

   }
