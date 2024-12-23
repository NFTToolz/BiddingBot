import Task, { ITask } from "@/models/task.model";
import { getUserIdFromCookies } from "@/utils";
import { connect } from "@/utils/mongodb";
import redisClient from "@/utils/redis";
import { NextRequest, NextResponse } from "next/server";

const redis = redisClient.getClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  await connect();
  const userId = await getUserIdFromCookies(request);
  const taskId = params.slug;
  const task = (await Task.findOne({
    _id: taskId,
  })) as unknown as ITask;
  const bidType =
    task.bidType.toLowerCase() === "collection" &&
    Object.keys(task?.selectedTraits || {}).length > 0
      ? "TRAIT"
      : task.tokenIds.length > 0
      ? "TOKEN"
      : "COLLECTION";

  const selectedMarketplaces = task.selectedMarketplaces;
  const selectedTraits = task.selectedTraits;
  const orderKeys: string[] = [];

  if (bidType === "TOKEN") {
    for (const marketplace of selectedMarketplaces) {
      const isBlur = marketplace.toLowerCase() === "blur";
      const baseKey = `${marketplace.toLowerCase()}:order:${
        task.contract.slug
      }`;

      if (isBlur) {
        orderKeys.push(`${baseKey}:default`);
      } else {
        const pattern = `*:${taskId}:${baseKey}:*[0-9]`;
        const matchingKeys = await redis.keys(pattern);
        const tokenKeys = matchingKeys.map((key) => {
          const parts = key.split(":");
          return `${baseKey}:${parts[parts.length - 1]}`;
        });
        orderKeys.push(...tokenKeys);
      }
    }
  } else if (bidType === "TRAIT") {
    for (const marketplace of selectedMarketplaces) {
      const baseKey = `${marketplace.toLowerCase()}:order:${
        task.contract.slug
      }`;

      for (const traitType in selectedTraits) {
        for (const trait of selectedTraits[traitType]) {
          switch (marketplace.toLowerCase()) {
            case "magiceden":
              const meTraitObject = JSON.stringify({
                attributeKey: traitType,
                attributeValue: trait.name,
              });
              orderKeys.push(`${baseKey}:${meTraitObject}`);
              break;
            case "blur":
              const blurTraitObject = {
                [traitType]: trait.name,
              };
              const jsonString = JSON.stringify(blurTraitObject);
              orderKeys.push(`${baseKey}:${jsonString}`);
              break;
            case "opensea":
              orderKeys.push(`${baseKey}:trait:${traitType}:${trait.name}`);
              break;
            default:
              orderKeys.push(`${baseKey}:${traitType}:${trait.name}`);
          }
        }
      }
    }
  } else if (bidType === "COLLECTION") {
    for (const marketplace of selectedMarketplaces) {
      const baseKey = `${marketplace.toLowerCase()}:order:${
        task.contract.slug
      }`;
      orderKeys.push(`${baseKey}:default`);
    }
  }
  const bidData = await Promise.all(
    orderKeys.map(async (key) => {
      const pattern = `*:${taskId}:${key}`;
      const matchingKeys = await redis.keys(pattern);
      if (matchingKeys.length === 0) {
        return null;
      }

      return await Promise.all(
        matchingKeys.map(async (fullKey) => {
          const parts = fullKey.split(":");
          const bidCount = parts[0];
          const taskId = parts[1];
          const marketplace = parts[2];
          const slug = parts[4];
          const rest = parts.slice(5);
          let identifier: any = rest.join(":");

          if (marketplace.toLowerCase() === "opensea" && bidType === "TRAIT") {
            const [, , , , traitType, traitValue] = key.split(":");
            identifier = { type: traitType, value: traitValue };
          } else if (
            marketplace.toLowerCase() === "blur" &&
            bidType === "TRAIT"
          ) {
            try {
              const cleanIdentifier = identifier.replace(/^"|"$/g, "");
              const traitObj = JSON.parse(cleanIdentifier);
              const [[type, value]] = Object.entries(traitObj);
              identifier = JSON.stringify({ [type]: value });
            } catch (e) {
              console.error("Error parsing Blur trait identifier:", e);
              return null;
            }
          } else if (
            marketplace.toLowerCase() === "magiceden" &&
            bidType === "TRAIT"
          ) {
            try {
              const parsedIdentifier = JSON.parse(identifier);
              identifier = {
                attributeKey: parsedIdentifier.attributeKey,
                attributeValue: parsedIdentifier.attributeValue,
              };
            } catch (e) {
              console.error("Error parsing MagicEden trait identifier:", e);
              return null;
            }
          }

          const [value, ttl] = await Promise.all([
            redis.get(fullKey),
            redis.ttl(fullKey),
          ]);
          let offerKey = `${bidCount}:${taskId}:${marketplace}:${slug}`;
          if (marketplace.toLowerCase() === "opensea" && bidType === "TRAIT") {
            offerKey += `:${JSON.stringify(identifier)}`;
          } else if (marketplace.toLowerCase() === "blur") {
            if (bidType === "TRAIT") {
              offerKey += `:${identifier}`;
            } else if (bidType === "COLLECTION") {
              offerKey += `:collection`;
            } else {
              offerKey += `:${identifier}`;
            }
          } else if (bidType === "TOKEN") {
            offerKey += `:${identifier}`;
          } else if (bidType === "COLLECTION") {
            offerKey += `:collection`;
          } else if (marketplace.toLowerCase() === "magiceden") {
            offerKey +=
              bidType === "TRAIT"
                ? `:${JSON.stringify(identifier)}`
                : `:${identifier}`;
          } else {
            offerKey += `:${
              identifier === "default" ? "collection" : identifier
            }`;
          }

          console.log({ offerKey });
          const offerPrice = await redis.get(offerKey);
          return {
            key: fullKey,
            value,
            ttl,
            marketplace,
            identifier,
            offerPrice,
            bidCount,
          };
        })
      );
    })
  );

  const flattenedBidData = bidData.flat();

  const bids = flattenedBidData
    .filter((bid) => bid !== null)
    .map((bid) => {
      if (bid.marketplace === "magiceden" && bid.value !== null) {
        const value = JSON.parse(bid.value);
        const orderId = value.orderId;
        return { ...bid, value: orderId };
      } else if (
        bid.marketplace.toLowerCase() === "blur" &&
        bid.value !== null
      ) {
        if (bidType === "TRAIT") {
          try {
            const traitObj = JSON.parse(bid.identifier);
            const [[type, value]] = Object.entries(traitObj);
            bid.identifier = { type, value };
          } catch (e) {
            console.error("Error parsing Blur trait identifier:", e);
          }
        }
        return { ...bid };
      } else {
        return { ...bid };
      }
    });

  console.log(bids);

  const offers = bids.filter((bid) => bid.ttl > 0);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(offers, { status: 200 });
}
