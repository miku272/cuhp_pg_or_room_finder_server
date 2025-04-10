import { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  token?: string;
  _id?: string;
  userName?: string;
}
