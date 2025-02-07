import { NextRequest } from "next/server";
import BidLogs from "@/models/logs.model";
import { NextResponse } from "next/server";
import { connect } from "@/utils/mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskId = params.id;

  try {
    await connect();
    const logs = await BidLogs.find({ taskId }).sort({ createdAt: -1 });
    return NextResponse.json(logs, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
