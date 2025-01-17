import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const NEXT_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_API_KEY as string;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug") as string;
    const address = searchParams.get("address") as `0x${string}`;

    const { magicedenTopOffer, blurTopOffer, openseaTopOffer } =
      await getMEHighestOffers(address, slug);

    const data = { magicedenTopOffer, blurTopOffer, openseaTopOffer };
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error in GET handler:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

async function getMEHighestOffers(contract: `0x${string}`, slug: string) {
  const BASE_URL =
    "https://api.nfttools.website/magiceden/v3/rtp/ethereum/orders/bids/v6";

  const headers_me = {
    accept: "application/json",
    "X-NFT-API-Key": NEXT_PUBLIC_API_KEY,
  };
  const url = `${BASE_URL}?collection=${contract}&status=active&sortBy=price&limit=50`;

  try {
    const { data } = await axios.get<BestOffers>(url, { headers: headers_me });

    const openseaTopOffer =
      data?.orders
        ?.filter((item) => item.source.name.toLowerCase() === "opensea")
        ?.sort((a, b) => b.price.amount.decimal - a.price.amount.decimal)[0]
        ?.price?.amount?.decimal || 0.0;

    const blurTopOffer =
      data?.orders
        ?.filter((item) => item.source.name.toLowerCase() === "blur")
        ?.sort((a, b) => b.price.amount.decimal - a.price.amount.decimal)[0]
        ?.price?.amount?.decimal || 0.0;

    const magicedenTopOffer =
      data?.orders?.sort(
        (a, b) => b.price.amount.decimal - a.price.amount.decimal
      )[0]?.price?.amount?.decimal || 0.0;

    return { openseaTopOffer, blurTopOffer, magicedenTopOffer };
  } catch (error) {
    console.error("Error fetching highest offers:", error);
    return { openseaTopOffer: 0.0, blurTopOffer: 0.0, magicedenTopOffer: 0.0 };
  }
}

export interface Orders {
  id: string;
  kind: string;
  side: string;
  status: string;
  tokenSetId: string;
  tokenSetSchemaHash: string;
  contract: string;
  contractKind: string;
  maker: string;
  taker: string;
  price: Price;
  validFrom: number;
  validUntil: number;
  quantityFilled: number;
  quantityRemaining: number;
  criteria: Criteria;
  source: Source;
  feeBps: number;
  feeBreakdown: FeeBreakdown[];
  expiration: number;
  isReservoir: boolean | null;
  createdAt: string;
  updatedAt: string;
  originatedAt: string | null;
}

interface BestOffers {
  orders: Orders[];
  continuation: string | null;
}

interface Amount {
  raw: string;
  decimal: number;
  usd: number;
  native: number;
}

interface NetAmount extends Amount {}

interface Price {
  currency: Currency;
  amount: Amount;
  netAmount: NetAmount;
}

interface Collection {
  id: string;
}

interface CriteriaData {
  collection: Collection;
}

interface Criteria {
  kind: string;
  data: CriteriaData;
}

interface Source {
  id: string;
  domain: string;
  name: string;
  icon: string;
  url: string;
}

interface FeeBreakdown {
  kind: string;
  recipient: string;
  bps: number;
}

interface Currency {
  contract: string;
  name: string;
  symbol: string;
  decimals: number;
}
