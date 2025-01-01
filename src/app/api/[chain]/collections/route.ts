import { NextRequest, NextResponse } from "next/server";

const NEXT_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_API_KEY as string;
export const RESET = "\x1b[0m";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug") as string;
    const apiUrl: string = `https://api.nfttools.website/opensea/api/v2/collections/${slug?.toLowerCase()}`;
    const response = await fetch(apiUrl, {
      headers: { "X-NFT-API-Key": NEXT_PUBLIC_API_KEY },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch collection data");
    }
    const collection: CollectionData = await response.json();

    const data = {
      ...collection,
    };
    if (
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
