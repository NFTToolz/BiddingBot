import { useEffect, useRef, useCallback, useState } from "react";

export const useWebSocket = (url: string) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [taskLockData, setTaskLockData] = useState<any>(null);
  const [bidStats, setBidStats] = useState<BidStats | null>(null);

  const connect = useCallback(() => {
    if (
      ws.current &&
      (ws.current.readyState === WebSocket.CONNECTING ||
        ws.current.readyState === WebSocket.OPEN)
    ) {
      console.log("WebSocket is already connecting or connected");
      return;
    }

    console.log("Connecting to WebSocket:", url);
    ws.current = new WebSocket(url);

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
  }, [url]);

  const retryConnection = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.CLOSED) {
      connect();
    } else {
      console.log("WebSocket is already connected or connecting");
    }
  }, [connect]);

  useEffect(() => {
    if (ws.current) {
      ws.current.close();
    }

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

  return {
    sendMessage,
    isConnected,
    retryConnection,
    taskLockData,
    bidStats,
  };
};

interface MarketplaceBids {
  opensea: number;
  magiceden: number;
  blur: number;
}

interface BidStats {
  bidRates: BidRates;
  bidCounts: {
    [taskId: string]: MarketplaceBids;
  };
}

export interface BidRates {
  opensea: MarketplaceBidRate;
  blur: MarketplaceBidRate;
  magiceden: MarketplaceBidRate;
}
interface MarketplaceBidRate {
  bidsPerSecond: number;
  totalBids: number;
  windowPeriod: number;
}

// bidStats: {
// 	'67672237fb92232b7ea15a05': { opensea: 0, magiceden: 0, blur: 11 },
// 	'67672237fb92232b7ea15a27': { opensea: 0, magiceden: 0, blur: 0 },
// 	'6767e833f73289fe66ef3a6a': { opensea: 0, magiceden: 0, blur: 0 },
// 	'67672237fb92232b7ea15a11': { opensea: 0, magiceden: 0, blur: 0 },
// 	'67672237fb92232b7ea15a09': { opensea: 0, magiceden: 0, blur: 31 },
// 	'67672237fb92232b7ea15a0d': { opensea: 0, magiceden: 0, blur: 0 },
// 	'67672237fb92232b7ea15a13': { opensea: 0, magiceden: 0, blur: 10 },
// 	'67672237fb92232b7ea15a0f': { opensea: 0, magiceden: 0, blur: 0 },
// 	'67672237fb92232b7ea15a0b': { opensea: 0, magiceden: 0, blur: 10 },
// 	'67672237fb92232b7ea15a07': { opensea: 0, magiceden: 0, blur: 0 },
// 	'67672237fb92232b7ea15a03': { opensea: 0, magiceden: 0, blur: 0 },
// 	'6767e833f73289fe66ef3a6b': { opensea: 0, magiceden: 0, blur: 0 },
// 	'67672237fb92232b7ea15a17': { opensea: 0, magiceden: 0, blur: 0 },
// 	'67672237fb92232b7ea15a1b': { opensea: 0, magiceden: 0, blur: 0 },
// 	'67672237fb92232b7ea15a1d': { opensea: 0, magiceden: 0, blur: 0 },
// 	'67672237fb92232b7ea15a19': { opensea: 0, magiceden: 0, blur: 0 },
// 	'67672237fb92232b7ea15a15': { opensea: 0, magiceden: 0, blur: 0 },
// 	'67672237fb92232b7ea15a25': { opensea: 0, magiceden: 0, blur: 0 }
// }
