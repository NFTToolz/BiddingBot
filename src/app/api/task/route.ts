import Task from "@/models/task.model";
import { getUserIdFromCookies } from "@/utils";
import { connect } from "@/utils/mongodb";
import { ethers } from "ethers";
import { NextRequest, NextResponse } from "next/server";

const NEXT_PUBLIC_ALCHEMY_API_KEY = process.env
  .NEXT_PUBLIC_ALCHEMY_API_KEY as string;
const abi = [
  "function balanceOf(address owner) view returns (uint256 balance)",
];

const url = `https://eth-mainnet.g.alchemy.com/v2/${NEXT_PUBLIC_ALCHEMY_API_KEY}`;
const provider = new ethers.JsonRpcProvider(url);

export async function GET(request: NextRequest) {
  await connect();
  const userId = await getUserIdFromCookies(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const tasks = await Task.find({ user: userId }).sort({ createdAt: -1 });
  return NextResponse.json(tasks, { status: 200 });
}

export async function POST(request: NextRequest) {
  await connect();
  const userId = await getUserIdFromCookies(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();

  const balance = await fetchBalance(
    body.wallet.address,
    body.contract.contractAddress
  );

  const task = await Task.create({
    ...body,
    contract: {
      slug: body.contract.slug,
      contractAddress: body.contract.contractAddress,
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
    user: userId,
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
    bidDuration: {
      value: +body.bidDuration.value,
      unit: body.bidDuration.unit,
    },
    loopInterval: {
      value: +body.loopInterval.value,
      unit: body.loopInterval.unit,
    },
    tokenIds: body.tokenIds || [],
    balance: balance,
  });
  return NextResponse.json(task, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  await connect();
  const userId = await getUserIdFromCookies(request);
  const { ids, running } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = await Task.updateMany(
    { _id: { $in: ids }, user: userId },
    { $set: { running } }
  );

  return NextResponse.json(
    { modifiedCount: tasks.modifiedCount },
    { status: 200 }
  );
}

export async function DELETE(request: NextRequest) {
  await connect();
  const userId = await getUserIdFromCookies(request);
  const { ids } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await Task.deleteMany({ _id: { $in: ids }, user: userId });

  return NextResponse.json(
    { deletedCount: result.deletedCount },
    { status: 200 }
  );
}

async function fetchBalance(
  address: string,
  contractAddress: string
): Promise<number> {
  const contract = new ethers.Contract(contractAddress, abi, provider);
  const balance = await contract.balanceOf(address);
  return Number(balance);
}
