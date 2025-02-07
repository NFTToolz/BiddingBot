import BidLogs from "@/models/logs.model";
import Task from "@/models/task.model";
import { getUserIdFromCookies } from "@/utils";
import { connect } from "@/utils/mongodb";
import { isObjectIdOrHexString } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

async function checkTaskOwnership(taskId: string, userId: string) {
  const task = await Task.findOne({ _id: taskId, user: userId });
  return task !== null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  const userId = await getUserIdFromCookies(request);
  const taskId = params.id;

  if (!isObjectIdOrHexString(taskId)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isOwner = await checkTaskOwnership(params.id, userId);
  if (!isOwner) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const task = await Task.findById(taskId);
  return NextResponse.json(task, { status: 200 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  const userId = await getUserIdFromCookies(request);
  const taskId = params.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isObjectIdOrHexString(taskId)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  const isOwner = await checkTaskOwnership(taskId, userId);
  if (!isOwner) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  const body = await request.json();
  const task = await Task.findByIdAndUpdate(
    params.id,
    {
      ...body,
      bidType: body.bidType || "collection",
      bidPriceType: body.bidPriceType || "GENERAL_BID_PRICE",
      stopOptions: {
        minFloorPrice: body.stopOptions.minFloorPrice,
        maxFloorPrice: body.stopOptions.maxFloorPrice,
        minTraitPrice: body.stopOptions.minTraitPrice,
        maxTraitPrice: body.stopOptions.maxTraitPrice,
        maxPurchase: body.stopOptions.maxPurchase,
        pauseAllBids: body.stopOptions.pauseAllBids,
        stopAllBids: body.stopOptions.stopAllBids,
        cancelAllBids: body.stopOptions.cancelAllBids,
        triggerStopOptions: body.stopOptions.triggerStopOptions,
      },
      bidPrice: {
        min: body.bidPrice.min,
        max: body.bidPrice.max,
        minType: body.bidPrice.minType,
        maxType: body.bidPrice.maxType,
      },
      openseaBidPrice: {
        min: body.openseaBidPrice.min,
        max: body.openseaBidPrice.max,
        minType: body.openseaBidPrice.minType,
        maxType: body.openseaBidPrice.maxType,
      },
      blurBidPrice: {
        min: body.blurBidPrice.min,
        max: body.blurBidPrice.max,
        minType: body.blurBidPrice.minType,
        maxType: body.blurBidPrice.maxType,
      },
      magicEdenBidPrice: {
        min: body.magicEdenBidPrice.min,
        max: body.magicEdenBidPrice.max,
        minType: body.magicEdenBidPrice.minType,
        maxType: body.magicEdenBidPrice.maxType,
      },
      contract: {
        slug: body.contract.slug,
        contractAddress: body.contract.contractAddress,
      },
      tags: body.tags,
      selectedTraits: body.selectedTraits,
      traits: body.traits,
      outbidOptions: {
        outbid: body.outbidOptions.outbid,
        blurOutbidMargin: body.outbidOptions.outbid
          ? body.outbidOptions.blurOutbidMargin
          : null,
        openseaOutbidMargin: body.outbidOptions.outbid
          ? body.outbidOptions.openseaOutbidMargin
          : null,
        magicedenOutbidMargin: body.outbidOptions.outbid
          ? body.outbidOptions.magicedenOutbidMargin
          : null,
        counterbid: body.outbidOptions.counterbid,
      },
      bidDuration: {
        value: +body.bidDuration.value, // Ensure this is a number
        unit: body.bidDuration.unit, // This should remain a string
      },
      loopInterval: {
        value: +body.loopInterval.value,
        unit: body.loopInterval.unit,
      },
      tokenIds: body.tokenIds || [],
    },
    { new: true }
  );
  return NextResponse.json(task, { status: 200 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  const userId = await getUserIdFromCookies(request);
  const taskId = params.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isObjectIdOrHexString(taskId)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  const isOwner = await checkTaskOwnership(taskId, userId);
  if (!isOwner) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Delete the task and its associated logs
  await Promise.all([
    Task.findByIdAndDelete(taskId),
    BidLogs.deleteMany({ taskId: taskId }),
  ]);

  return NextResponse.json(
    { message: "Task and associated logs deleted successfully" },
    { status: 200 }
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  const userId = await getUserIdFromCookies(request);
  const taskId = params.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isObjectIdOrHexString(taskId)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  const isOwner = await checkTaskOwnership(taskId, userId);
  if (!isOwner) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const body = await request.json();
  const task = await Task.findByIdAndUpdate(
    taskId,
    { $set: body },
    { new: true }
  );
  return NextResponse.json(task, { status: 200 });
}
