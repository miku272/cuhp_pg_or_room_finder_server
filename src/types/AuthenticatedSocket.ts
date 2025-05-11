import { Socket } from 'socket.io';

/**
 * Extends Socket.io Socket interface to include authentication-related properties
 * for authenticated WebSocket connections.
 *
 * This interface enables type-safe access to user authentication data in socket handlers
 * after a socket connection has been authenticated through middleware.
 *
 * @interface AuthenticatedSocket
 * @extends {Socket}
 * @property {string} [token] - The authentication token associated with the socket connection
 * @property {string} [_id] - The authenticated user's ID
 * @property {string} [userName] - The authenticated user's username
 */
export interface AuthenticatedSocket extends Socket {
  token?: string;
  _id?: string;
  userName?: string;
}
