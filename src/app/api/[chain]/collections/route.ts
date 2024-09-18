import { getUserIdFromCookies } from "@/utils";
import axios from "axios";
import { ethers, Wallet as Web3Wallet } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import PQueue from "p-queue"; // Import PQueue

const API_KEY = "8fa3d411-a50c-43cb-ac4e-1306575ac586";
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY as string;

const queue = new PQueue({ concurrency: 8 }); // Create a queue with concurrency of 3

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug") as string;
    const apiUrl: string = `https://api.nfttools.website/opensea/api/v2/collections/${slug?.toLowerCase()}`;

    // Add the fetch request to the queue
    const response = await queue.add(() =>
      fetch(apiUrl, {
        headers: { "X-NFT-API-Key": API_KEY },
      })
    );

    // Check if the response is okay
    if (!response.ok) {
      throw new Error("Failed to fetch collection data");
    }

    const collection: CollectionData = await response.json();

    // Use addAll to handle multiple promises concurrently
    const [traits, magicEdenValid, blurValid] = await queue.addAll([
      () => getCollectionTraits(slug),
      () => checkMagicEden(collection.contracts[0].address, slug),
      () => checkBlur(collection.contracts[0].address),
    ]);

    const data = { ...collection, traits, magicEdenValid, blurValid };

    if (
      collection.collection_offers_enabled &&
      collection.total_supply > 0 &&
      collection.contracts[0].chain.toLowerCase() === "ethereum"
    ) {
      return NextResponse.json(data, { status: 200 });
    } else {
      return NextResponse.json(
        { error: "Collection offers not enabled" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in GET handler:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

export async function getCollectionTraits(collectionSlug: string) {
  try {
    const response = await fetch(
      `https://api.nfttools.website/opensea/api/v2/traits/${collectionSlug}`,
      {
        headers: {
          accept: "application/json",
          "X-NFT-API-Key": API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch collection traits");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching collection traits:", error);
    throw error;
  }
}

async function checkMagicEden(
  contractAddress: string,
  slug: string
): Promise<boolean> {
  const apiUrl = `https://api.nfttools.website/magiceden/v3/rtp/ethereum/collections/v7?id=${contractAddress}`;
  const headers = {
    accept: "application/json",
    "X-NFT-API-Key": API_KEY,
  };

  try {
    let response: any = await fetch(apiUrl, { headers });
    response = await response.json();

    return (
      response.collections[0].chainId === 1 &&
      response.collections[0].slug.toLowerCase() === slug.toLowerCase()
    );
  } catch (error) {
    console.error("Error checking Magic Eden:", error);
    return false;
  }
}

async function checkBlur(contractAddress: string): Promise<boolean> {
  const BLUR_API_URL = "https://api.nfttools.website/blur";
  const options = {
    method: "GET",
    url: `${BLUR_API_URL}/v1/collections/${contractAddress}`,
    headers: {
      "X-NFT-API-Key": API_KEY,
    },
  };

  try {
    const response = await axios.get(options.url, {
      headers: options.headers,
    });

    return response.data.success;
  } catch (error: any) {
    console.error("Error checking Blur:", error.response.data);
    return false;
  }
}

export async function getAccessToken(
  url: string,
  private_key: string
): Promise<string | undefined> {
  const provider = new ethers.AlchemyProvider("mainnet", ALCHEMY_API_KEY);
  const wallet = new Web3Wallet(private_key, provider);
  const options = { walletAddress: wallet.address };

  const headers = {
    "content-type": "application/json",
    "X-NFT-API-Key": API_KEY,
  };

  try {
    let response: any = await axios.post(`${url}/auth/challenge`, options, {
      headers,
    });

    const message = response.data.message;
    const signature = await wallet.signMessage(message);
    const data = {
      message: message,
      walletAddress: wallet.address,
      expiresOn: response.data.expiresOn,
      hmac: response.data.hmac,
      signature: signature,
    };

    response = await axios.post(`${url}/auth/login`, data, { headers });

    return response.data.accessToken;
  } catch (error: any) {
    console.error(
      "getAccessToken Error:",
      error.response?.data || error.message
    );
  }
}

export interface CollectionData {
  collection: string;
  name: string;
  description: string;
  image_url: string;
  banner_image_url: string;
  owner: string;
  safelist_status: string;
  category: string;
  is_disabled: boolean;
  is_nsfw: boolean;
  trait_offers_enabled: boolean;
  collection_offers_enabled: boolean;
  opensea_url: string;
  project_url: string;
  wiki_url: string;
  discord_url: string;
  telegram_url: string;
  twitter_username: string;
  instagram_username: string;
  contracts: {
    address: string;
    chain: string;
  }[];
  editors: string[];
  fees: {
    fee: number;
    recipient: string;
    required: boolean;
  }[];
  payment_tokens: {
    symbol: string;
    address: string;
    chain: string;
    image: string;
    name: string;
    decimals: number;
    eth_price: string;
    usd_price: string;
  }[];
  total_supply: number;
  created_date: string;
}
