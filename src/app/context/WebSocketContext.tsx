"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";

interface WebSocketContextType {
  sendMessage: (message: any) => void;
  isConnected: boolean;
  retryConnection: () => void;
  taskLockData: any;
  bidStats: BidStats | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  sendMessage: () => {},
  isConnected: false,
  retryConnection: () => {},
  taskLockData: null,
  bidStats: null,
});

export const useWebSocket = () => useContext(WebSocketContext);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [taskLockData, setTaskLockData] = useState<any>(null);
  const [bidStats, setBidStats] = useState<BidStats | null>(null);

  const connect = useCallback(() => {
    if (
      ws.current?.readyState === WebSocket.CONNECTING ||
      ws.current?.readyState === WebSocket.OPEN
    ) {
      console.log("WebSocket is already connecting or connected");
      return;
    }

    const NEXT_PUBLIC_SERVER_WEBSOCKET = process.env
      .NEXT_PUBLIC_SERVER_WEBSOCKET as string;
    console.log("Connecting to WebSocket:", NEXT_PUBLIC_SERVER_WEBSOCKET);
    ws.current = new WebSocket(NEXT_PUBLIC_SERVER_WEBSOCKET);

    ws.current.onopen = () => {
      console.log("WebSocket connected successfully");
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "taskLockUpdate") {
          setTaskLockData(message.data);
        } else if (message.type === "bidRatesUpdate") {
          setBidStats(message.data);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      setTimeout(connect, 3000);
    };
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected");
    }
  }, []);

  const retryConnection = useCallback(() => {
    if (ws.current?.readyState === WebSocket.CLOSED) {
      connect();
    } else {
      console.log("WebSocket is already connected or connecting");
    }
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      ws.current?.close();
    };
  }, [connect]);

  return (
    <WebSocketContext.Provider
      value={{
        sendMessage,
        isConnected,
        retryConnection,
        taskLockData,
        bidStats,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

interface MarketplaceBids {
  opensea: number;
  magiceden: number;
  blur: number;
}

interface BidCounts {
  [taskId: string]: MarketplaceBids;
}

export interface BidStats {
  bidRates: BidRates;
  bidCounts: BidCounts;
}

export interface BidRates {
  opensea: MarketplaceBidRate;
  blur: MarketplaceBidRate;
  magiceden: MarketplaceBidRate;
}

interface MarketplaceBids {
  opensea: number;
  magiceden: number;
  blur: number;
}

interface MarketplaceBidRate {
  bidsPerSecond: number;
  totalBids: number;
  windowPeriod: number;
}
