import { io } from 'socket.io-client';

let socket;

const socketUrl =
  import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

export const getSocket = () => {
  if (socketUrl.includes('vercel.app')) {
    // Vercel serverless doesn't support websockets. Return a stub.
    return {
      connected: false,
      connect: () => {},
      disconnect: () => {},
      emit: () => {},
      on: () => {},
      off: () => {},
    };
  }

  if (!socket) {
    socket = io(socketUrl, {
      autoConnect: false,
      transports: ['polling'],
      upgrade: false,
      rememberUpgrade: false,
    });
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};
