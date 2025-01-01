import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const NEXT_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_API_KEY as string;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug") as string;
    const address = searchParams.get("address") as string;

    const tasks = [
      fetchBlurFloorPrice(slug),
      fetchMagicEdenData(address),
      fetchOpenSeaCollectionStats(slug),
      fetchBlurTraits(address),
      fetchMagicEdenAttributes(address),
      fetchTraitData(slug),
    ];

    const [
      blurFloorPrice,
      magicedenFloorPrice,
      openseaFloorPrice,
      blurTraits,
      magicEdenTraits,
      openseaTraitData,
    ] = await Promise.all(tasks);

    const openseaTraits = transformOpenseaTrait(openseaTraitData);

    const combinedTraits: {
      categories: Record<string, string>;
      counts: Record<
        string,
        Record<
          string,
          {
            count: number;
            availableInMarketplaces: string[];
            magicedenFloor: number;
            blurFloor: number;
            openseaFloor: number;
          }
        >
      >;
    } = {
      categories: {},
      counts: {},
    };

    const marketplaces = ["opensea", "magiceden", "blur"] as const;

    const traitsData = [
      openseaTraits,
      (magicEdenTraits as MagicEdenData).traits,
      (blurTraits as IBlurData)?.traits,
    ];

    marketplaces.forEach((marketplace, index) => {
      const traits = traitsData[index];

      Object.entries(traits.categories).forEach(([category]) => {
        if (!combinedTraits.categories[category]) {
          combinedTraits.categories[category] = "string";
        }
        if (!combinedTraits.counts[category]) {
          combinedTraits.counts[category] = {};
        }

        Object.entries(traits.counts[category]).forEach(([trait, count]) => {
          if (!combinedTraits.counts[category][trait]) {
            combinedTraits.counts[category][trait] = {
              count: 0,
              availableInMarketplaces: [],
              magicedenFloor: 0,
              blurFloor: 0,
              openseaFloor: 0,
            };
          }

          if (
            typeof count === "number" &&
            count > combinedTraits.counts[category][trait].count
          ) {
            combinedTraits.counts[category][trait].count = count;
          }

          if (
            !combinedTraits.counts[category][
              trait
            ].availableInMarketplaces.includes(marketplace)
          ) {
            combinedTraits.counts[category][trait].availableInMarketplaces.push(
              marketplace
            );
          }
          if (
            marketplace === "blur" &&
            (blurTraits as IBlurData)?.blurRaw?.traits &&
            (blurTraits as IBlurData)?.blurRaw?.traits[category]
          ) {
            const blurFloor =
              Number(
                (blurTraits as IBlurData)?.blurRaw?.traits[category][trait]
                  ?.floor?.amount
              ) || 0;
            combinedTraits.counts[category][trait].blurFloor = blurFloor;
          }

          // Add MagicEden floor price
          if (
            marketplace === "magiceden" &&
            (magicEdenTraits as MagicEdenData)?.magicedenRaw?.attributes
          ) {
            const magicEdenAttribute = (
              magicEdenTraits as MagicEdenData
            )?.magicedenRaw?.attributes.find(
              (attr: any) => attr.key === category
            );
            if (magicEdenAttribute) {
              const magicEdenValue = magicEdenAttribute.values.find(
                (value: any) => value.value === trait
              );
              if (magicEdenValue && magicEdenValue.floorAskPrice) {
                combinedTraits.counts[category][trait].magicedenFloor =
                  magicEdenValue?.floorAskPrice?.amount?.decimal;
              }
            }
          }

          if (
            marketplace === "opensea" &&
            (openseaTraitData as OpenseaTraits)?.data?.collection?.stringTraits
          ) {
            const openseaTrait = (
              openseaTraitData as OpenseaTraits
            )?.data?.collection.stringTraits.find(
              (t: any) => t.key.toLowerCase() === category.toLowerCase()
            );
            if (openseaTrait) {
              const openseaValue = openseaTrait.counts.find(
                (c: any) => c.value.toLowerCase() === trait.toLowerCase()
              );
              if (openseaValue && openseaValue.floor) {
                combinedTraits.counts[category][trait].openseaFloor =
                  parseFloat(openseaValue.floor.eth);
              }
            }
          }
        });
      });
    });
    const data = {
      traits: combinedTraits,
      magicEdenValid: Number(magicedenFloorPrice) > 0,
      blurValid: Number(blurFloorPrice) > 0,
      blurFloorPrice,
      magicedenFloorPrice,
      openseaFloorPrice,
    };
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error in GET handler:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

export async function fetchBlurFloorPrice(collectionSlug: string) {
  const apiUrl = `https://api.nfttools.website/blur/v1/collections/${collectionSlug}`;
  try {
    const response = await fetch(apiUrl, {
      headers: {
        accept: "application/json",
        "X-NFT-API-Key": NEXT_PUBLIC_API_KEY,
      },
    });
    if (!response.ok) {
      return 0;
    }
    const data: BlurFloorPriceResponse = await response.json();
    return +data.collection.floorPrice.amount;
  } catch (error) {
    console.error("Error fetching BLUR floor price:", error);
    throw error;
  }
}

export async function fetchMagicEdenData(collectionId: string) {
  const url = `https://api.nfttools.website/magiceden_stats/collection_stats/stats?chain=ethereum&collectionId=${collectionId}`;

  try {
    const { data } = await axios.get<MagicEdenCollection>(url, {
      headers: {
        accept: "application/json",
        "X-NFT-API-Key": NEXT_PUBLIC_API_KEY,
      },
    });
    return +data.floorPrice.amount;
  } catch (error: any) {
    console.error("Error fetching Magic Eden data:", error.response.data);
    return 0;
  }
}

export async function fetchOpenSeaCollectionStats(collectionSlug: string) {
  const url = `https://api.nfttools.website/opensea/api/v2/collections/${collectionSlug}/stats`;
  try {
    const { data } = await axios.get(url, {
      headers: {
        "X-NFT-API-Key": NEXT_PUBLIC_API_KEY,
      },
    });
    return +data.total.floor_price;
  } catch (error) {
    console.error("Error fetching OpenSea collection stats:", error);
  }
}

export async function fetchBlurTraits(
  contractAddress: string
): Promise<IBlurData> {
  const url = `https://api.nfttools.website/blur/v1/traits/${contractAddress}`;
  try {
    const { data } = await axios.get(url, {
      headers: { "X-NFT-API-Key": NEXT_PUBLIC_API_KEY },
    });
    const traits = transformBlurTraits(data.traits);
    return { traits, blurRaw: data };
  } catch (error) {
    console.error("Error fetching BLUR traits:", error);
    return {
      traits: { categories: {}, counts: {} },
      blurRaw: { success: false, traits: {} },
    };
  }
}

export async function fetchMagicEdenAttributes(
  collectionId: string
): Promise<MagicEdenData> {
  const url = `https://api.nfttools.website/magiceden/v3/rtp/ethereum/collections/${collectionId}/attributes/all/v4`;
  try {
    const { data } = await axios.get<MagicEdenTraits>(url, {
      headers: {
        accept: "application/json",
        "X-NFT-API-Key": NEXT_PUBLIC_API_KEY,
      },
    });

    const traits = transformMagicEdenTraits(data);
    return { traits, magicedenRaw: data };
  } catch (error) {
    console.error("Error fetching Magic Eden attributes:", error);
    return {
      traits: { categories: {}, counts: {} },
      magicedenRaw: { attributes: [] },
    };
  }
}

function transformMagicEdenTraits(magicEdenTraits: MagicEdenTraits): Traits {
  const traits: Traits = {
    categories: {},
    counts: {},
  };

  if (!magicEdenTraits || !magicEdenTraits.attributes) {
    return traits;
  }

  try {
    magicEdenTraits.attributes.forEach((attribute) => {
      if (!attribute || !attribute.key || !attribute.values) return;

      const { key, values } = attribute;
      traits.categories[key] = "string";
      traits.counts[key] = {};

      values.forEach((value) => {
        if (!value || !value.value) return;
        const { value: itemValue, count } = value;
        traits.counts[key][itemValue] = count;
      });
    });

    return traits;
  } catch (error) {
    console.error("Error transforming Magic Eden traits:", error);
    return traits;
  }
}

const fetchTraitData = async (collectionSlug: string) => {
  try {
    const data = {
      id: "TraitSelectorQuery",
      query:
        "query TraitSelectorQuery(\n  $collectionSlug: CollectionSlug\n  $withTraitFloor: Boolean\n) {\n  collection(collection: $collectionSlug) {\n    ...TraitSelector_data_4zPn1c\n    id\n  }\n}\n\nfragment TraitSelector_data_4zPn1c on CollectionType {\n  statsV2 {\n    totalSupply\n  }\n  stringTraits(withTraitFloor: $withTraitFloor) {\n    key\n    counts {\n      count\n      value\n      floor {\n        eth\n        unit\n        symbol\n        usd\n      }\n    }\n  }\n}\n",
      variables: {
        collectionSlug: collectionSlug,
        withTraitFloor: true,
      },
    };

    const { data: openseaTraits } = await axios.post<OpenseaTraits>(
      "https://api.nfttools.website/opensea/__api/graphql/",
      data,
      {
        headers: {
          "X-NFT-API-Key": NEXT_PUBLIC_API_KEY,
          "content-type": "application/json",
          "x-signed-query":
            "6ae240a98f748a2ecef0a71cb6424c3d47c9c62691ca07ebadf318bf7fcc9517",
        },
      }
    );
    return openseaTraits;
  } catch (error: any) {
    console.error("Error fetching trait data:", error.response.data.errors);
  }
};

function transformBlurTraits(
  blurTraits: Record<string, Record<string, any>>
): Traits {
  try {
    const traits: {
      categories: Record<string, string>;
      counts: Record<string, Record<string, number>>;
    } = {
      categories: {},
      counts: {},
    };
    for (const category in blurTraits) {
      traits.categories[category] = "string";
      traits.counts[category] = {};
      for (const item in blurTraits[category]) {
        traits.counts[category][item] = 0;
      }
    }
    return traits;
  } catch (error) {
    return { categories: {}, counts: {} };
  }
}

function transformOpenseaTrait(actualData: any) {
  const result: any = {
    categories: {},
    counts: {},
  };
  actualData.data.collection.stringTraits.forEach((trait: any) => {
    result.categories[trait.key] = "string";
    result.counts[trait.key] = {};
    trait.counts.forEach((item: any) => {
      result.counts[trait.key][item.value] = item.count;
    });
  });

  return result;
}

async function getOpenseaTraits(collectionSlug: string) {
  try {
    const response = await fetch(
      `https://api.nfttools.website/opensea/api/v2/traits/${collectionSlug}`,
      {
        headers: {
          accept: "application/json",
          "X-NFT-API-Key": NEXT_PUBLIC_API_KEY,
        },
      }
    );

    if (!response.ok) return;
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching collection traits:", error);
  }
}

export interface BlurFloorPriceResponse {
  success: boolean;
  collection: {
    contractAddress: string;
    name: string;
    collectionSlug: string;
    imageUrl: string;
    totalSupply: number;
    numberOwners: number;
    floorPrice: {
      amount: string;
      unit: string;
    };
    floorPriceOneDay: {
      amount: string;
      unit: string;
    };
    floorPriceOneWeek: {
      amount: string;
      unit: string;
    };
    volumeFifteenMinutes: null | number;
    volumeOneDay: {
      amount: string;
      unit: string;
    };
    volumeOneWeek: {
      amount: string;
      unit: string;
    };
    bestCollectionBid: {
      amount: string;
      unit: string;
    };
    totalCollectionBidValue: {
      amount: string;
      unit: string;
    };
    traitFrequencies: Record<string, any>;
    bestCollectionLoanOffer: null;
  };
}

interface MagicEdenCollection {
  collectionId: string;
  chain: string;
  collectionSymbol: string;
  contract: string;
  image: string;
  isVerified: boolean;
  listedCount: number;
  ownerCount: number;
  tokenCount: string;
  floorPrice: {
    amount: number;
    currency: string;
    native: number;
  };
  topOffer: {
    amount: number;
    currency: string;
    native: number;
  };
  totalVol: number;
  volume10m: number;
  volume1h: number;
  volume6h: number;
  volume24hr: number;
  volume7d: number;
  volume30d: number;
  avgPrice24hr: number;
  avgPrice7d: number;
  avgPrice30d: number;
  txns10m: number;
  txns1h: number;
  txns6h: number;
  txns24hr: number;
  txns7d: number;
  txns30d: number;
  deltaFloor24hr: number;
  deltaFloor7d: number;
  deltaFloor30d: number;
}

interface Traits {
  categories: {
    [key: string]: string;
  };
  counts: {
    [key: string]: Record<string, number>;
  };
}

interface IBlurData {
  traits: {
    categories: IBlurTraitCategories;
    counts: IBlurTraitCounts;
  };
  blurRaw: {
    success: boolean;
    traits: IBlurTraits;
  };
}

interface IBlurTraitCategories {
  [key: string]: string;
}

interface IBlurTraitCounts {
  [key: string]: {
    [key: string]: number;
  };
}

interface IBlurTraits {
  [key: string]: {
    [key: string]: IBlurTraitData;
  };
}

interface IBlurTraitData {
  sale?: {
    amount: string;
    unit: string;
    listedAt: string;
  };
  floor?: {
    amount: string;
    unit: string;
    listedAt: string;
  };
  bestBidPrice?: {
    amount: string;
    unit: string;
  } | null;
  totalBidValue?: {
    amount: string;
    unit: string;
  } | null;
}

interface MagicEdenData {
  traits: MagicEdenTraitsData;
  magicedenRaw: MagicEdenRaw;
}

interface MagicEdenTraitsData {
  categories: {
    [key: string]: string;
  };
  counts: {
    [key: string]: {
      [key: string]: number;
    };
  };
}

interface MagicEdenRaw {
  attributes: MagicEdenRawAttribute[];
}

interface MagicEdenRawAttribute {
  key: string;
  attributeCount: number;
  kind: string;
  values: MagicEdenRawAttributeValue[];
}

interface MagicEdenRawAttributeValue {
  count: number;
  value: string;
  floorAskPrice?: {
    currency: MagicEdenCurrency;
    amount: MagicEdenAmount;
  };
}

interface MagicEdenCurrency {
  contract: string;
  name: string;
  symbol: string;
  decimals: number;
}

interface MagicEdenAmount {
  raw: string;
  decimal: number;
  usd: number;
  native: number;
}

type MagicEdenTraits = {
  attributes: MagicEdenAttribute[];
};

type MagicEdenAttribute = {
  key: string;
  attributeCount: number;
  kind: string;
  values: MagicEdenValue[];
};

type MagicEdenValue = {
  count: number;
  value: string;
  floorAskPrice?: {
    currency: {
      contract: string;
      name: string;
      symbol: string;
      decimals: number;
    };
    amount: {
      raw: string;
      decimal: number;
      usd: number;
      native: number;
    };
  };
};

interface OpenseaTraits {
  data: OpenseaData;
}

interface OpenseaData {
  collection: OpenseaCollection;
}

interface OpenseaCollection {
  statsV2: OpenseaStatsV2;
  stringTraits: OpenseaStringTrait[];
  id: string;
}

interface OpenseaStatsV2 {
  totalSupply: number;
}

interface OpenseaStringTrait {
  key: string;
  counts: OpenseaTraitCount[];
}

interface OpenseaTraitCount {
  count: number;
  value: string;
  floor: OpenseaFloor | null;
}

interface OpenseaFloor {
  eth: string;
  unit: string;
  symbol: string;
  usd: string;
}
