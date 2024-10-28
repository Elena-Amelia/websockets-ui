export type UserType = {
  name: string;
  password: string;
  index: string | number;
};
export type ClientType = {
  name: string;
  index: string | number;
};
export type responseType = {
  type: string;
  data: regDataType;
  id: number;
};

export type regDataType = {
  name: string;
  password: string;
};

export type RoomType = {
  roomId: string | number;
  roomUsers: RoomUsersType[];
};

type RoomUsersType = {
  name: string;
  index: string | number;
};

export type GameType = {
  idGame: string | number;
  idPlayer1: string | number;
  idPlayer2: string | number;
  activePlayer?: string | number;
};

export type CurrentGameType = {
  gameId: string | number;
  ships: ShipType[];
  indexPlayer: string | number;
};

export type UserShipsType = {
  gameId: string | number;
  indexPlayer: string | number;
  shipLength: number;
  ships: ShipCoord[];
  direction: boolean;
  type: string;
  };

export type ShipCoord = {
  x: number;
  y: number;
// 
  length: number;
};
export type ShipType = {
  position: { x: number; y: number };
  direction: boolean;
  type: string;
  length: number;
};

export type WinnersDataType = {
  name: string | number;
  wins: number;
};
export type Coord = {
    x: number;
    y: number;
    player?: string|number
  };
  export type InvalidCeils = {
    x: number;
    y: number;
    player: string|number;
    gameId: string|number;
  };