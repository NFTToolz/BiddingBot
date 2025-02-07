import Task from "@/models/task.model";
import { ethers } from "ethers";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

const NEXT_PUBLIC_ALCHEMY_API_KEY = process.env
  .NEXT_PUBLIC_ALCHEMY_API_KEY as string;
const abi = [
  "function balanceOf(address owner) view returns (uint256 balance)",
];

const url = `https://eth-mainnet.g.alchemy.com/v2/${NEXT_PUBLIC_ALCHEMY_API_KEY}`;
const provider = new ethers.JsonRpcProvider(url);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const contractAddress = searchParams.get("contractAddress");
    const taskId = searchParams.get("taskId");

    if (!address || !contractAddress) {
      return NextResponse.json(
        { error: "Address and contract address are required" },
        { status: 400 }
      );
    }

    // Validate addresses are valid Ethereum addresses
    if (!ethers.isAddress(address) || !ethers.isAddress(contractAddress)) {
      return NextResponse.json(
        { error: "Invalid Ethereum address format" },
        { status: 400 }
      );
    }
    const balance = await fetchBalance(address, contractAddress);

    console.log({ balance });

    if (taskId) {
      if (taskId !== "undefined" && mongoose.Types.ObjectId.isValid(taskId)) {
        await Task.updateOne({ _id: taskId }, { $set: { balance: balance } });
      }
    }

    return NextResponse.json({ balance });
  } catch (error) {
    console.error("Error fetching balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch balance" },
      { status: 500 }
    );
  }
}

async function fetchBalance(
  address: string,
  contractAddress: string
): Promise<number> {
  const contract = new ethers.Contract(contractAddress, abi, provider);
  const balance = await contract.balanceOf(address);
  return Number(balance);
}
