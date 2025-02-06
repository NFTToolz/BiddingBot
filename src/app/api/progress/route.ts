import { getUserIdFromCookies } from "@/utils";
import redisClient from "@/utils/redis";
import { NextRequest, NextResponse } from "next/server";

const redis = redisClient.getClient();

type Marketplace = "opensea" | "magiceden" | "blur";

// Add this interface before the POST function
interface Task {
  slug: string;
  selectedMarketplaces: Marketplace[];
  taskId: string;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromCookies(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tasks }: { tasks: Task[] } = await request.json();
    const orderCounts: BidStats = {};
    const loopStat: LoopStat = {};

    await Promise.all(
      tasks.map(async ({ selectedMarketplaces, taskId }) => {
        orderCounts[taskId] = { opensea: 0, magiceden: 0, blur: 0 };
        loopStat[taskId] = {
          opensea: { count: 0, nextLoop: Date.now() },
          magiceden: { count: 0, nextLoop: Date.now() },
          blur: { count: 0, nextLoop: Date.now() },
        };
      })
    );
    return NextResponse.json({ orderCounts, loopStat }, { status: 200 });
  } catch (error) {
    console.error("Progress API error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

interface BidStats {
  [key: string]: {
    opensea: number;
    magiceden: number;
    blur: number;
  };
}

export interface LoopStat {
  [key: string]: {
    opensea: {
      count: number;
      nextLoop: number;
    };
    magiceden: {
      count: number;
      nextLoop: number;
    };
    blur: {
      count: number;
      nextLoop: number;
    };
  };
}
