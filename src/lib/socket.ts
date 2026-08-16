import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

let socketInstance: Socket | null = null;

export function getSocket(token?: string | null): Socket {
  if (!socketInstance && typeof window !== 'undefined') {
    socketInstance = io(`${WS_URL}/realtime`, {
      auth: {
        token: token || undefined,
      },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    });
  } else if (socketInstance && token) {
    socketInstance.auth = { token };
  }

  return socketInstance!;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
