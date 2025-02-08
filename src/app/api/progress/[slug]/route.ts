import Task, { ITask } from "@/models/task.model";
import { getUserIdFromCookies } from "@/utils";
import { connect } from "@/utils/mongodb";
import redisClient from "@/utils/redis";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const redis = await redisClient.getClient();

  await connect();
  const userId = await getUserIdFromCookies(request);
  const taskId = params.slug;
  const task = (await Task.findOne({
    _id: taskId,
  })) as unknown as ITask;

  const magicedenOrderTrackingKey = `{${taskId}}:magiceden:orders`;
  const magicedenOrderKeys = await redis.smembers(magicedenOrderTrackingKey);

  const openseaOrderTrackingKey = `{${taskId}}:opensea:orders`;
  const openseaOrderKeys = await redis.smembers(openseaOrderTrackingKey);

  const blurOrderTrackingKey = `{${taskId}}:blur:orders`;
  const blurOrderKeys = await redis.smembers(blurOrderTrackingKey);

  const magicedenOrders = magicedenOrderKeys.length
    ? await redis.mget(magicedenOrderKeys)
    : [];
  const openseaOrders = openseaOrderKeys.length
    ? await redis.mget(openseaOrderKeys)
    : [];

  const blurOrders = blurOrderKeys.length
    ? await redis.mget(blurOrderKeys)
    : [];
  const bidType =
    task.bidType.toLowerCase() === "collection" &&
    Object.keys(task?.selectedTraits || {}).length > 0
      ? "TRAIT"
      : task.tokenIds.length > 0
      ? "TOKEN"
      : "COLLECTION";
  const offers = [];

  if (bidType === "TOKEN" || bidType === "COLLECTION") {
    const magicedenBids = magicedenOrders.map((orderKey, index) => {
      if (!orderKey) return null;
      const parts = magicedenOrderKeys[index].split(":");
      const bidCount = parts[1];
      const orderData = JSON.parse(orderKey);

      return {
        key: magicedenOrderKeys[index],
        value: orderData.payload,
        marketplace: "magiceden",
        offerPrice: orderData.offer,
        createdAt: Number(orderData.createdAt),
        bidCount,
        identifier: parts[parts.length - 1],
      };
    });

    const openseaBids = openseaOrders.map((orderKey, index) => {
      if (!orderKey) return null;
      const parts = openseaOrderKeys[index].split(":");
      const bidCount = parts[1];
      const orderData = JSON.parse(orderKey);

      return {
        key: openseaOrderKeys[index],
        value: orderData.orderId,
        marketplace: "opensea",
        offerPrice: orderData.offer,
        createdAt: Number(orderData.createdAt),
        bidCount,
        identifier: parts[parts.length - 1],
      };
    });

    const blurBids = blurOrders.map((orderKey, index) => {
      if (!orderKey) return null;
      const parts = blurOrderKeys[index].split(":");
      const bidCount = parts[1];
      const orderData = JSON.parse(orderKey);

      return {
        key: blurOrderKeys[index],
        value: orderData.payload,
        marketplace: "blur",
        offerPrice: orderData.offer,
        createdAt: Number(orderData.createdAt),
        bidCount,
        identifier: parts[parts.length - 1],
      };
    });

    offers.push(...magicedenBids, ...openseaBids, ...blurBids);
  } else if (bidType === "TRAIT") {
    const magicedenBids = magicedenOrders.map((orderKey, index) => {
      if (!orderKey) return null;
      const parts = magicedenOrderKeys[index].split(":");
      const bidCount = parts[1];
      const orderData = JSON.parse(orderKey);

      return {
        key: magicedenOrderKeys[index],
        value: orderData.payload,
        marketplace: "magiceden",
        identifier: `${parts[5]}:${parts[6]}`,
        offerPrice: orderData.offer,
        createdAt: Number(orderData.createdAt),
        bidCount,
        traitType: parts[5],
        traitValue: parts[6],
      };
    });

    const openseaBids = openseaOrders.map((orderKey, index) => {
      if (!orderKey) return null;
      const parts = openseaOrderKeys[index].split(":");
      const bidCount = parts[1];
      const orderData = JSON.parse(orderKey);

      return {
        key: openseaOrderKeys[index],
        value: orderData.orderId,
        marketplace: "opensea",
        identifier: `${parts[5]}:${parts[6]}`,
        offerPrice: orderData.offer,
        createdAt: Number(orderData.createdAt),
        bidCount,
        traitType: parts[5],
        traitValue: parts[6],
      };
    });

    const blurBids = blurOrders.map((orderKey, index) => {
      if (!orderKey) return null;
      const parts = blurOrderKeys[index].split(":");
      const bidCount = parts[1];
      const orderData = JSON.parse(orderKey);

      return {
        key: blurOrderKeys[index],
        value: orderData.payload,
        marketplace: "blur",
        identifier: `${parts[5]}:${parts[6]}`,
        offerPrice: orderData.offer,
        createdAt: Number(orderData.createdAt),
        bidCount,
        traitType: parts[5],
        traitValue: parts[6],
      };
    });

    offers.push(...magicedenBids, ...openseaBids, ...blurBids);
    offers.sort((a: any, b: any) => a.createdAt - b.createdAt);
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(offers, { status: 200 });
}
