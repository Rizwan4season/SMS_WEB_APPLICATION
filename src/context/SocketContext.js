'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children, token, apiBaseUrl }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token || !apiBaseUrl) {
      setSocket(null);
      return;
    }

    const socketUrl = apiBaseUrl.replace(/\/$/, "");
    console.log(`Connecting to Socket.io server at: ${socketUrl}`);
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    newSocket.on('connect', () => {
      console.log(`Socket.io connected successfully: ${newSocket.id}`);
    });

    newSocket.on('connect_error', (error) => {
      console.error(`Socket.io connection error for ${socketUrl}:`, error);
    });

    setSocket(newSocket);

    return () => {
      console.log(`Disconnecting Socket.io: ${newSocket.id}`);
      newSocket.disconnect();
    };
  }, [token, apiBaseUrl]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
