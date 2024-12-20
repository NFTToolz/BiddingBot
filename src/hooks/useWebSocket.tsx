import { useEffect, useRef, useCallback, useState } from "react";

export const useWebSocket = (url: string) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    console.log("Connecting to WebSocket:", url);
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log("WebSocket connected successfully");
      setIsConnected(true);
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      setTimeout(connect, 3000);
    };
  }, [url]);

  const retryConnection = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.CLOSED) {
      connect();
    } else {
      console.log("WebSocket is already connected or connecting");
    }
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected");
    }
  }, []);

  return { sendMessage, isConnected, retryConnection };
};
