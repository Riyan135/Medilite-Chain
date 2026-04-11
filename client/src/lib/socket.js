import { io } from 'socket.io-client';

let socket;

const socketUrl =
  import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

export const getSocket = () => {
  if (!socket) {
    socket = io(socketUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

