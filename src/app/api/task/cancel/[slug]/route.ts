import Task, { ITask } from "@/models/task.model";
import { getUserIdFromCookies } from "@/utils";
import redisClient from "@/utils/redis";
import axios, { AxiosInstance } from "axios";
import Bottleneck from "bottleneck";
import { ethers, Wallet } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import axiosRetry, { IAxiosRetryConfig } from "axios-retry";
import PQueue from "p-queue";
import { config } from "dotenv";
import { Cluster } from "ioredis";

config();
const NEXT_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_API_KEY as string;
const BLUR_API_URL = "https://api.nfttools.website/blur";

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY as string;
const provider = new ethers.AlchemyProvider("mainnet", ALCHEMY_API_KEY);
export const SEAPORT_CONTRACT_ADDRESS =
  "0x0000000000000068f116a894984e2db1123eb395";
const rateLimit = parseInt(process.env.NEXT_PUBLIC_RATE_LIMIT as string);

const queue = new PQueue({
  concurrency: rateLimit,
});

const limiter = new Bottleneck({
  minTime: 1 / rateLimit,
});

const axiosInstance: AxiosInstance = axios.create({
  timeout: 300000,
});

const retryConfig: IAxiosRetryConfig = {
  retries: 3,
  retryDelay: (retryCount, error) => {
    limiter.schedule(() => Promise.resolve());
    if (error.response && error.response.status === 429) {
      return 2000;
    }
    return axiosRetry.exponentialDelay(retryCount);
  },
  retryCondition: async (error: any) => {
    if (
      /have reached the maximum number of offers you can make: 20/i.test(
        error.response.data.error
      )
    ) {
      return false;
    }
    if (/Insufficient funds. Required/i.test(error.response.data.error)) {
      return false;
    }
    if (
      /This offer does not exists. It is either not valid anymore or canceled by the offerer./i.test(
        error.response.data.error
      )
    ) {
      return false;
    }

    if (
      /You already have an offer for this token/i.test(
        error.response.data.error
      )
    ) {
      return true;
    }
    if (
      axiosRetry.isNetworkError(error) ||
      (error.response && error.response.status === 429)
    ) {
      return true;
    }
    return false;
  },
};

axiosRetry(axiosInstance, retryConfig);

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const redis = await redisClient.getClient();

    const bids: OfferData[] = await request.json();
    const userId = await getUserIdFromCookies(request);
    const slug = params.slug;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }
    if (!slug) {
      return NextResponse.json({ error: "Slug is required." }, { status: 400 });
    }

    const task = (await Task.findOne({
      _id: slug,
      user: userId,
    })) as unknown as ITask;

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const privateKey = task.wallet.privateKey;
    const magicedenBids = bids.filter((bid) => bid.marketplace === "magiceden");
    const openseaBids = bids.filter((bid) => bid.marketplace === "opensea");
    const blurBids = bids.filter((bid) => bid.marketplace === "blur");

    if (magicedenBids.length > 0) {
      const orderTrackingKey = `{${slug}}:magiceden:orders`;
      const BATCH_SIZE = 1000;
      for (let i = 0; i < magicedenBids.length; i += BATCH_SIZE) {
        const batch = magicedenBids.slice(i, i + BATCH_SIZE);

        await Promise.all([
          cancelMagicEdenBid(
            batch.map((bid) => bid.value),
            privateKey
          ),
          ...batch.flatMap((bid) => [
            redis.del(bid.key),
            redis.srem(orderTrackingKey, bid.key),
          ]),
        ]);
      }
    }

    if (openseaBids.length > 0) {
      const orderTrackingKey = `{${slug}}:opensea:orders`;

      await queue.addAll(
        openseaBids.map((item, index) => async () => {
          await Promise.all([
            cancelOpenseaBid(item.value, SEAPORT_CONTRACT_ADDRESS, privateKey),
            redis.srem(orderTrackingKey, item.key),
            redis.del(item.key),
          ]);
        })
      );
    }

    if (blurBids.length > 0) {
      const orderTrackingKey = `{${slug}}:blur:orders`;

      await queue.addAll(
        blurBids.map((item) => async () => {
          console.log({ item });

          const payload: any = item.value;
          const privateKey = task.wallet.privateKey;
          const data: BlurCancelPayload = { payload, privateKey };
          await Promise.all([
            cancelBlurBid(data, redis),
            redis.srem(orderTrackingKey, item.key),
            redis.del(item.key),
          ]);
        })
      );
    }
    return NextResponse.json(bids, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function cancelBlurBid(data: BlurCancelPayload, redis: Cluster) {
  try {
    console.log({ data });
    const { payload, privateKey } = data;

    const wallet = new Wallet(privateKey, provider);
    const walletAddress = wallet.address;
    const accessToken = await getAccessToken(BLUR_API_URL, privateKey, redis);
    const endpoint = `${BLUR_API_URL}/v1/collection-bids/cancel`;
    const { data: cancelResponse } = await limiter.schedule(() =>
      axiosInstance.post(endpoint, payload, {
        headers: {
          "content-type": "application/json",
          authToken: accessToken,
          walletAddress: walletAddress.toLowerCase(),
          "X-NFT-API-Key": NEXT_PUBLIC_API_KEY,
        },
      })
    );
    console.log(JSON.stringify(cancelResponse));
  } catch (error: any) {
    console.log(error.response.data);
  }
}

async function getAccessToken(
  url: string,
  private_key: string,
  redis: Cluster
): Promise<string | undefined> {
  const wallet = new Wallet(private_key, provider);
  const options = { walletAddress: wallet.address };

  const headers = {
    "content-type": "application/json",
    "X-NFT-API-Key": NEXT_PUBLIC_API_KEY,
  };

  try {
    const key = `{blurAccessToken}:${wallet.address}`;
    const cachedToken = await redis.get(key);
    if (cachedToken) {
      return cachedToken;
    }
    let response: any = await limiter.schedule(() =>
      axiosInstance.post(`${url}/auth/challenge`, options, { headers })
    );
    const message = response.data.message;
    const signature = await wallet.signMessage(message);
    const data = {
      message: message,
      walletAddress: wallet.address,
      expiresOn: response.data.expiresOn,
      hmac: response.data.hmac,
      signature: signature,
    };
    response = await limiter.schedule(() =>
      axiosInstance.post(`${url}/auth/login`, data, { headers })
    );
    const accessToken = response.data.accessToken;
    await redis.set(key, accessToken, "EX", 2 * 60 * 60);
    return accessToken;
  } catch (error: any) {
    console.error(
      "getAccessToken Error:",
      error.response?.data || error.message
    );
  }
}

export async function cancelOpenseaBid(
  orderHash: string,
  protocolAddress: string,
  privateKey: string
) {
  const offererSignature = await signOpenseaCancelOrder(
    orderHash,
    protocolAddress,
    privateKey
  );

  if (!offererSignature) {
    console.error("Failed to sign the cancel order.");
    return;
  }

  const url = `https://api.nfttools.website/opensea/api/v2/orders/chain/ethereum/protocol/${protocolAddress}/${orderHash}/cancel`;

  const headers = {
    "content-type": "application/json",
    "X-NFT-API-Key": NEXT_PUBLIC_API_KEY,
  };

  const body = {
    offerer_signature: offererSignature,
  };

  try {
    const response = await limiter.schedule(() =>
      axiosInstance.post(url, body, { headers })
    );
    console.log(JSON.stringify({ cancelled: true }));
    return response.data;
  } catch (error: any) {
    console.error(
      "Error sending the cancel order request: ",
      error.response ? error.response.data : error.message
    );
  }
}

async function signOpenseaCancelOrder(
  orderHash: string,
  protocolAddress: string,
  privateKey: string
) {
  if (!orderHash) return;

  const wallet = new Wallet(privateKey, provider);
  const domain = {
    name: "Seaport",
    version: "1.6",
    chainId: "1",
    verifyingContract: protocolAddress,
  };
  const types = {
    OrderHash: [{ name: "orderHash", type: "bytes32" }],
  };
  const value = {
    orderHash: orderHash,
  };
  try {
    const signature = await wallet.signTypedData(domain, types, value);
    return signature;
  } catch (error) {
    console.error(
      "Error signing the cancel order message for order hash:",
      orderHash,
      error
    );
    return null;
  }
}

export async function cancelMagicEdenBid(
  orderIds: string[],
  privateKey: string
) {
  try {
    const extractedOrderIds = orderIds
      .map((bid) => {
        if (!bid) return null;
        try {
          const parsed = JSON.parse(bid);

          if (parsed.results) {
            return parsed.results[0].orderId;
          }
          if (parsed.message && parsed.orderId) {
            return parsed.orderId;
          }

          return null;
        } catch (e) {
          console.error("Error parsing bid data:", e);
          return null;
        }
      })
      .filter((id) => id !== null);

    const { data } = await limiter.schedule(() =>
      axiosInstance.post<MagicEdenCancelOfferCancel>(
        "https://api.nfttools.website/magiceden/v3/rtp/ethereum/execute/cancel/v3",
        { orderIds: extractedOrderIds },
        {
          headers: {
            "content-type": "application/json",
            "X-NFT-API-Key": NEXT_PUBLIC_API_KEY,
          },
        }
      )
    );
    const cancelStep = data?.steps?.find(
      (step) => step.id === "cancellation-signature"
    );
    const cancelItem = cancelStep?.items[0]?.data?.sign;
    const cancelData = cancelItem
      ? cancelItem
      : {
          signatureKind: "eip712",
          domain: {
            name: "Off-Chain Cancellation",
            version: "1.0.0",
            chainId: 1,
          },
          types: { OrderHashes: [{ name: "orderHashes", type: "bytes32[]" }] },
          value: {
            orderHashes: [...extractedOrderIds],
          },
          primaryType: "OrderHashes",
        };
    const signature = await signCancelOrder(cancelData, privateKey);
    const body = cancelStep?.items[0].data.post.body;
    const cancelBody = cancelItem
      ? body
      : {
          orderIds: [...extractedOrderIds],
          orderKind: "payment-processor-v2",
        };
    const { data: cancelResponse } = await limiter.schedule(() =>
      axiosInstance.post(
        `https://api.nfttools.website/magiceden/v3/rtp/ethereum/execute/cancel-signature/v1?signature=${signature}`,
        cancelBody,
        {
          headers: {
            "content-type": "application/json",
            "X-NFT-API-Key": NEXT_PUBLIC_API_KEY,
          },
        }
      )
    );
    console.log(JSON.stringify(cancelResponse));
  } catch (error: any) {
    console.error(error.response.data); // Log the error for debugging
  }
}

interface OfferData {
  key: string;
  value: string;
  ttl: number;
  marketplace: string;
  identifier: any;
  offerPrice: string;
  expirationDate: string;
}

async function signCancelOrder(
  cancelItem: any | undefined,
  privateKey: string
) {
  try {
    if (!cancelItem) {
      console.log("INVALID CANCEL DATA");
      return;
    }
    const wallet = new Wallet(privateKey, provider);
    const signature = await wallet.signTypedData(
      cancelItem.domain,
      cancelItem.types,
      cancelItem.value
    );

    return signature;
  } catch (error) {
    console.log(error);
  }
}

interface MagicEdenCancelOfferCancel {
  steps: StepCancel[];
}

interface StepCancel {
  id: string;
  action: string;
  description: string;
  kind: string;
  items: ItemCancel[];
}

interface ItemCancel {
  status: string;
  orderIds: string[];
  data: DataCancel;
}

interface DataCancel {
  sign: SignCancel;
  post: PostCancel;
}

interface SignCancel {
  signatureKind: string;
  domain: DomainCancel;
  types: any;
  value: ValueCancel;
}

interface DomainCancel {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

interface PostCancel {
  endpoint: string;
  method: string;
  body: BodyCancel;
}

interface ValueCancel {
  orderHashes: string[];
}

interface BodyCancel {
  orderIds: string[];
  orderKind: string;
}

interface BlurCancelPayload {
  payload: {
    contractAddress: string;
    criteriaPrices: Array<{
      price: string;
      criteria?: {
        type: string;
        value: Record<string, string>;
      };
    }>;
  };
  privateKey: string;
}
