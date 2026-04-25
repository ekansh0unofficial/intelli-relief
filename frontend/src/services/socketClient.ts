import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({ path: "/ws", transports: ["websocket"], autoConnect: false });
  }
  return socket;
}

export function connectSocket(token: string): void {
  const s = getSocket();
  s.auth = { token };
  // `active` is true while connected OR during auto-reconnect back-off,
  // preventing duplicate connect() calls during reconnection cycles.
  if (!s.active) s.connect();
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}
