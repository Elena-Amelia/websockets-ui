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

export type roomsDataType = {
        roomId: string;
        roomUsers: object[];
    //      [
    //       {  name: user1,
    //          index: user1Index,
    //       }, 
    //   ],
   }

   export type winnersDataType = {
        name: string;
        wins: number;

   }
