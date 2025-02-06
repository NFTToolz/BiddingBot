import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const NEXT_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_API_KEY as string;
export const RESET = "\x1b[0m";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug") as string;
    const apiUrl: string = `https://api.nfttools.website/opensea/api/v2/collections/${slug?.toLowerCase()}`;

    const [collectionResult, blurResult] = await Promise.allSettled([
      axios.get(apiUrl, {
        headers: { "X-NFT-API-Key": NEXT_PUBLIC_API_KEY },
      }),
      axios.get(
        `https://api.nfttools.website/blur/v1/collections/${slug?.toLowerCase()}`,
        {
          headers: { "X-NFT-API-Key": NEXT_PUBLIC_API_KEY },
        }
      ),
    ]);

    const collection: CollectionData =
      collectionResult.status === "fulfilled"
        ? collectionResult.value.data
        : null;
    const blurData: BlurResponse =
      blurResult.status === "fulfilled" ? blurResult.value.data : null;

    // Handle case where both API calls fail
    if (!collection && !blurData) {
      return NextResponse.json(
        { error: "Unable to fetch collection data" },
        { status: 404 }
      );
    }

    const slugValid =
      (collection?.collection_offers_enabled ?? false) ||
      (blurData?.collection?.floorPrice?.amount
        ? Number(blurData.collection.floorPrice.amount) > 0
        : false);
    const contractAddress =
      collection?.contracts[0]?.address ||
      blurData?.collection?.contractAddress;

    const data = {
      ...collection,
      slugValid,
      blurData: blurData?.collection, // Optionally include blur data
      contractAddress,
    };

    if (slugValid) {
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

// validate the slug or blur
// validate the slug on opensea
// slugValid should be if slug is valid on

// https://core-api.prod.blur.io/v1/collections/goblintown-8

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

interface BlurPriceInfo {
  amount: string;
  unit: string;
}

interface BlurTraitValue {
  __magic_null_trait_value: number;
  [key: string]: number;
}

interface BlurTraitFrequencies {
  Eers: BlurTraitValue;
  Hedz: BlurTraitValue;
  "1 of 1": BlurTraitValue;
  Boddee: BlurTraitValue;
  collrzes: BlurTraitValue;
  MUNCHYHOLE: BlurTraitValue;
  djeimebdie: BlurTraitValue;
  stankfinder: BlurTraitValue;
  "Eye on dat side": BlurTraitValue;
  "Eyz on dis side": BlurTraitValue;
}

interface BlurCollection {
  contractAddress: string;
  name: string;
  collectionSlug: string;
  imageUrl: string;
  totalSupply: number;
  numberOwners: number;
  floorPrice: BlurPriceInfo;
  floorPriceOneDay: BlurPriceInfo;
  floorPriceOneWeek: BlurPriceInfo;
  volumeFifteenMinutes: null;
  volumeOneDay: BlurPriceInfo;
  volumeOneWeek: BlurPriceInfo;
  bestCollectionBid: BlurPriceInfo;
  totalCollectionBidValue: BlurPriceInfo;
  traitFrequencies: BlurTraitFrequencies;
  bestCollectionLoanOffer: null;
}

interface BlurResponse {
  success: boolean;
  collection: BlurCollection;
}
