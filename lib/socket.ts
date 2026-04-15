import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    // socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "https://tongits.onrender.com");
    socket = io("http://localhost:3001");
  }
  return socket;
};





















