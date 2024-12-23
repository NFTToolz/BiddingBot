import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { config } from "dotenv";

config();

const ERC20_BAL_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
];

const WETH_CONTRACT_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const BLUR_POOL_ADDRESS = "0x0000000000A39bb272e79075ade125fd351887Ac";
const NEXT_PUBLIC_ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;

    if (!ethers.isAddress(address)) {
      return NextResponse.json(
        { error: "Invalid Ethereum address" },
        { status: 400 }
      );
    }

    const provider = new ethers.AlchemyProvider(
      "mainnet",
      NEXT_PUBLIC_ALCHEMY_API_KEY
    );

    // Fetch ETH balance
    const ethBalance = await provider.getBalance(address);

    const wethContract = new ethers.Contract(
      WETH_CONTRACT_ADDRESS,
      ERC20_BAL_ABI,
      provider
    );
    const wethBalance = await wethContract.balanceOf(address);
    const bethContract = new ethers.Contract(
      BLUR_POOL_ADDRESS,
      ERC20_BAL_ABI,
      provider
    );
    const bethBalance = await bethContract.balanceOf(address);

    return NextResponse.json({
      eth: ethers.formatEther(ethBalance),
      weth: ethers.formatEther(wethBalance),
      beth: ethers.formatEther(bethBalance),
    });
  } catch (error) {
    console.error("Error fetching balances:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallet balances" },
      { status: 500 }
    );
  }
}
