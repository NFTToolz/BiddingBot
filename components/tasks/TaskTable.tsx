import React, { useState, useEffect, useMemo } from "react";
import { Task } from "@/store/task.store";
import Toggle from "@/components/common/Toggle";
import EditIcon from "@/assets/svg/EditIcon";
import { Tag } from "@/store/tag.store";
import Link from "next/link";
import DeleteIcon from "@/assets/svg/DeleteIcon";
import { useTaskStore } from "@/store/task.store";
import { toast } from "react-toastify";
import { MergedTask } from "@/app/dashboard/tasks/page";
import { BidStats } from "@/app/context/WebSocketContext";
import useSWR from "swr";
import axios from "axios";
import DeleteModal from "@/components/tasks/DeleteTaskModal";

const GENERAL_BID_PRICE = "GENERAL_BID_PRICE";
const MARKETPLACE_BID_PRICE = "MARKETPLACE_BID_PRICE";
const MOCK_FLOOR_PRICES = {
  opensea: 1.25,
  blur: 1.23,
  magiceden: 1.27,
};

const MOCK_BEST_OFFERS = {
  opensea: 1.15,
  blur: 1.18,
  magiceden: 1.2,
};

const getMarketplaceUrls = (slug: string) => ({
  opensea: `https://opensea.io/collection/${slug}`,
  blur: `https://blur.io/collection/${slug}`,
  magiceden: `https://magiceden.io/collections/ethereum/${slug}`,
});

const axiosInstance = axios.create();

interface CollectionStats {
  total: {
    floor_price: number;
  };
}

const fetchFloorPrice = async (slug: string, contractAddress: string) => {
  try {
    const { data } = await axiosInstance.get<{
      blurFloorPrice: number;
      openseaFloorPrice: number;
      magicedenFloorPrice: number;
    }>(`/api/ethereum/details?slug=${slug}&address=${contractAddress}`);

    const { blurFloorPrice, openseaFloorPrice, magicedenFloorPrice } = data;

    console.log({
      slug,
      contractAddress,
      blurFloorPrice,
      openseaFloorPrice,
      magicedenFloorPrice,
    });

    return { blurFloorPrice, openseaFloorPrice, magicedenFloorPrice };
  } catch (error) {
    console.error(`Error fetching floor price for ${slug}:`, error);
    return null;
  }
};

const TaskTable: React.FC<TaskTableProps> = ({
  selectedTasks,
  selectAll,
  onToggleSelectAll,
  onToggleTaskSelection,
  onToggleTaskStatus,
  onToggleMarketplace,
  onEditTask,
  isVerificationMode = false,
  mergedTasks,
  totalBids,
  skipBids,
  tasks,
  errorBids,
  sendMessage,
  bidStats,
}) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const { deleteTask, deleteImportedTask } = useTaskStore();

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (taskToDelete) {
      if (isVerificationMode) {
        deleteImportedTask(taskToDelete?._id);
      } else {
        try {
          await fetch(`/api/task/${taskToDelete._id}`, {
            method: "DELETE",
            credentials: "include",
          });

          deleteTask(taskToDelete._id);
          toast.success("Task deleted successfully");

          const message = {
            endpoint: "stop-task",
            data: taskToDelete,
          };

          if (sendMessage) {
            sendMessage(message);
          }
        } catch (error) {
          console.log("handleDeleteConfirm: ", error);
          toast.error("Failed to delete task");
        }
        setDeleteModalOpen(false);
        setTaskToDelete(null);
      }
    }
  };

  useEffect(() => {
    mergedTasks?.forEach((task) => {
      if (
        task.selectedMarketplaces.includes("Blur") &&
        task.bidType === "token"
      ) {
        onToggleMarketplace(task._id, "Blur");
      }
    });
  }, [mergedTasks, onToggleMarketplace]);

  const isMergedTask = (task: Task | MergedTask): task is MergedTask => {
    return "bidStats" in task;
  };

  const totalBidsPerSecond = !bidStats?.bidRates
    ? 0
    : bidStats.bidRates.opensea.bidsPerSecond +
      bidStats.bidRates.blur.bidsPerSecond +
      bidStats.bidRates.magiceden.bidsPerSecond;

  const getBidType = (task: Task) => {
    if (task.tokenIds.length > 0) {
      return "TOKEN";
    }
    if (Object.keys(task.selectedTraits || {}).length > 0) {
      return "TRAIT";
    }
    return task.bidType.toUpperCase();
  };

  // Get unique slugs of running tasks
  const runningTaskSlugs = useMemo(
    () =>
      Array.from(
        new Set(
          tasks
            .filter((task) => task.running)
            .map((task) => ({
              slug: task.contract.slug,
              contractAddress: task.contract.contractAddress,
            }))
        )
      ),
    [tasks]
  );

  // Fetch floor prices for running tasks
  const { data: floorPrices } = useSWR(
    runningTaskSlugs.length > 0 ? ["floorPrices", runningTaskSlugs] : null,
    async () => {
      const prices: Record<
        string,
        {
          blurFloorPrice: number;
          openseaFloorPrice: number;
          magicedenFloorPrice: number;
        }
      > = {};
      for (const { slug, contractAddress } of runningTaskSlugs) {
        const price = await fetchFloorPrice(slug, contractAddress);
        if (price !== null) {
          prices[slug] = price;
        }
      }
      return prices;
    },
    {
      refreshInterval: 5000, // Poll every 5 seconds
      revalidateOnFocus: false,
    }
  );

  console.log({ floorPrices });

  return (
    <>
      {isVerificationMode ? null : (
        <>
          <div className="flex my-4 gap-4 text-sm">
            <p>Active Bids</p>
            {["opensea", "blur", "magiceden"].map((marketplace, index) => (
              <div className="flex gap-2 items-center" key={index}>
                <div
                  className={`w-4 h-4 rounded-full ${
                    marketplace === "opensea"
                      ? "bg-[#2081e2]"
                      : marketplace === "blur"
                      ? "bg-[#FF8700]"
                      : marketplace === "magiceden"
                      ? "bg-[#e42575]"
                      : ""
                  }`}
                ></div>
                <div>
                  {
                    (totalBids || { opensea: 0, blur: 0, magiceden: 0 })[
                      marketplace as keyof typeof totalBids
                    ]
                  }
                </div>
              </div>
            ))}

            <div className="flex gap-4">
              <p>Bid Per Second:</p>
              <p>{Math.ceil(totalBidsPerSecond)} / s</p>
            </div>
          </div>

          <div className="flex my-4 gap-4 text-sm">
            <p>Skipped Bids</p>
            {["opensea", "blur", "magiceden"].map((marketplace, index) => (
              <div className="flex gap-2 items-center" key={index}>
                <div
                  className={`w-4 h-4 rounded-full ${
                    marketplace === "opensea"
                      ? "bg-[#2081e2]"
                      : marketplace === "blur"
                      ? "bg-[#FF8700]"
                      : marketplace === "magiceden"
                      ? "bg-[#e42575]"
                      : ""
                  }`}
                ></div>
                <div>
                  {(skipBids || { opensea: 0, blur: 0, magiceden: 0 })[
                    marketplace as keyof typeof skipBids
                  ] || 0}
                </div>
              </div>
            ))}
          </div>

          <div className="flex my-4 gap-4 text-sm">
            <p>Error Bids</p>
            {["opensea", "blur", "magiceden"].map((marketplace, index) => (
              <div className="flex gap-2 items-center" key={index}>
                <div
                  className={`w-4 h-4 rounded-full ${
                    marketplace === "opensea"
                      ? "bg-[#2081e2]"
                      : marketplace === "blur"
                      ? "bg-[#FF8700]"
                      : marketplace === "magiceden"
                      ? "bg-[#e42575]"
                      : ""
                  }`}
                ></div>
                <div>
                  {(errorBids || { opensea: 0, blur: 0, magiceden: 0 })[
                    marketplace as keyof typeof errorBids
                  ] || 0}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="border rounded-2xl py-3 sm:py-5 px-2 sm:px-3 bg-[#1f2129] border-Neutral/Neutral-Border-[night] h-full">
        <div className="overflow-x-auto w-full">
          <table className="min-w-full table-fixed whitespace-nowrap text-sm">
            <thead className="hidden sm:table-header-group">
              <tr className="border-b border-Neutral/Neutral-Border-[night]">
                <th scope="col" className="px-3 py-3 text-center w-[100px]">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectAll}
                      onChange={onToggleSelectAll}
                    />
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors duration-200 ease-in-out ${
                        selectAll
                          ? "bg-[#7F56D9] border-[#7F56D9]"
                          : "bg-transparent border-gray-400"
                      }`}
                    >
                      {selectAll && (
                        <svg
                          className="w-3 h-3 text-white"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M13.3333 4L6 11.3333L2.66667 8"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </label>
                </th>
                <th scope="col" className="px-3 py-3 text-center w-[180px]">
                  Slug
                </th>

                {isVerificationMode ? null : (
                  <>
                    <th scope="col" className="px-3 py-3 text-center w-[180px]">
                      Active Bids
                    </th>

                    <th scope="col" className="px-3 py-3 text-center w-[180px]">
                      Skipped Bids
                    </th>
                    <th scope="col" className="px-3 py-3 text-center w-[180px]">
                      Error Bids
                    </th>
                  </>
                )}
                <th scope="col" className="px-3 py-3 text-center w-[120px]">
                  Bid Type
                </th>

                <th scope="col" className="px-3 py-3 text-center w-[120px]">
                  Min Price
                </th>
                <th scope="col" className="px-3 py-3 text-center w-[120px]">
                  Max Price
                </th>
                <th scope="col" className="px-3 py-3 text-center w-[150px]">
                  <div className="flex items-center gap-2 justify-center">
                    <span>OS</span>
                    <Toggle
                      checked={tasks.some((task) =>
                        task.selectedMarketplaces.includes("OpenSea")
                      )}
                      onChange={() => {
                        tasks.forEach((task) => {
                          onToggleMarketplace(task._id, "OpenSea");
                        });
                      }}
                      activeColor="#2081e2"
                      inactiveColor="#3F3F46"
                    />
                  </div>
                </th>
                <th scope="col" className="px-3 py-3 text-center w-[150px]">
                  <div className="flex items-center gap-2 justify-center">
                    <span>Blur</span>
                    <Toggle
                      checked={tasks.some((task) =>
                        task.selectedMarketplaces.includes("Blur")
                      )}
                      onChange={() => {
                        tasks.forEach((task) => {
                          if (
                            !task.selectedMarketplaces.includes("Blur") &&
                            (!task.blurValid || task.bidType === "token")
                          )
                            return;
                          onToggleMarketplace(task._id, "Blur");
                        });
                      }}
                      activeColor="#FF8700"
                      inactiveColor="#3F3F46"
                    />
                  </div>
                </th>
                <th scope="col" className="px-3 py-3 text-center w-[150px]">
                  <div className="flex items-center gap-2 justify-center">
                    <span>MagicEden</span>
                    <Toggle
                      checked={tasks.some((task) =>
                        task.selectedMarketplaces.includes("MagicEden")
                      )}
                      onChange={() => {
                        tasks.forEach((task) => {
                          onToggleMarketplace(task._id, "MagicEden");
                        });
                      }}
                      activeColor="#e42575"
                      inactiveColor="#3F3F46"
                    />
                  </div>
                </th>
                <th scope="col" className="px-3 py-3 text-center w-[100px]">
                  Tags
                </th>
                {isVerificationMode ? null : (
                  <th scope="col" className="px-3 py-3 text-center w-[100px]">
                    Start
                  </th>
                )}
                <th scope="col" className="px-3 py-3 text-center w-[80px]">
                  Edit
                </th>
                <th scope="col" className="px-3 py-3 text-center w-[80px]">
                  Delete
                </th>
              </tr>
            </thead>
            <tbody>
              {(isVerificationMode ? tasks : mergedTasks)?.map(
                (task: Task | MergedTask) => {
                  return (
                    <tr
                      key={task._id}
                      className="border-b border-Neutral/Neutral-Border-[night] sm:table-row"
                    >
                      <td className="px-3 py-4 text-center w-[100px]">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={selectedTasks.includes(task._id)}
                            onChange={() => onToggleTaskSelection(task._id)}
                          />
                          <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors duration-200 ease-in-out ${
                              selectedTasks.includes(task._id)
                                ? "bg-[#7F56D9] border-[#7F56D9]"
                                : "bg-transparent border-gray-400"
                            }`}
                          >
                            {selectedTasks.includes(task._id) && (
                              <svg
                                className="w-3 h-3 text-white"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M13.3333 4L6 11.3333L2.66667 8"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                        </label>
                      </td>

                      <td className="px-3 py-4 text-center w-[180px]">
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/dashboard/tasks/${task._id}`}
                            className="text-Brand/Brand-1 underline text-sm mb-2"
                          >
                            {task.contract.slug}
                          </Link>

                          {/* Market stats */}
                          <div className="flex flex-col gap-2 text-sm">
                            {task.selectedMarketplaces.map((marketplace) => {
                              const marketplaceKey = marketplace.toLowerCase();
                              const urls = getMarketplaceUrls(
                                marketplaceKey === "magiceden"
                                  ? task.contract.contractAddress
                                  : task.contract.slug
                              );
                              return (
                                <Link
                                  key={`stats-${marketplace}`}
                                  href={
                                    urls[marketplaceKey as keyof typeof urls]
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex justify-between px-3 py-2 rounded hover:opacity-80 transition-opacity group ${
                                    marketplaceKey === "opensea"
                                      ? "bg-[#2081e2]/10"
                                      : marketplaceKey === "blur"
                                      ? "bg-[#FF8700]/10"
                                      : "bg-[#e42575]/10"
                                  }`}
                                >
                                  <div
                                    className={`flex items-center gap-2 ${
                                      marketplaceKey === "opensea"
                                        ? "text-[#2081e2]"
                                        : marketplaceKey === "blur"
                                        ? "text-[#FF8700]"
                                        : "text-[#e42575]"
                                    }`}
                                  >
                                    {marketplace === "OpenSea"
                                      ? "OS"
                                      : marketplace === "MagicEden"
                                      ? "ME"
                                      : marketplace}
                                    <svg
                                      className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                      />
                                    </svg>
                                  </div>
                                  <div className="flex gap-3">
                                    <span className="opacity-70">Floor:</span>
                                    <span>
                                      {marketplaceKey === "opensea"
                                        ? floorPrices?.[
                                            task.contract.slug
                                          ]?.openseaFloorPrice.toFixed(4) ||
                                          "--"
                                        : MOCK_FLOOR_PRICES[
                                            marketplaceKey as keyof typeof MOCK_FLOOR_PRICES
                                          ]}
                                      Ξ
                                    </span>
                                    <span className="opacity-50">|</span>
                                    <span className="opacity-70">Best:</span>
                                    <span>
                                      {
                                        MOCK_BEST_OFFERS[
                                          marketplaceKey as keyof typeof MOCK_BEST_OFFERS
                                        ]
                                      }
                                      Ξ
                                    </span>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </td>

                      {isVerificationMode ? null : (
                        <td className="px-3 py-4 text-center w-[500px]">
                          <div className="mb-4">Hello World</div>
                          <div className="flex flex-col gap-2 text-sm">
                            {task.selectedMarketplaces.length > 0
                              ? task.selectedMarketplaces
                                  .sort()
                                  .map((marketplace) =>
                                    marketplace.toLowerCase()
                                  )
                                  .map((marketplace, index) => {
                                    const total =
                                      task.bidType === "collection" &&
                                      Object.keys(task?.selectedTraits || {})
                                        .length == 0
                                        ? 1
                                        : Object.keys(
                                            task?.selectedTraits || {}
                                          ).length > 0
                                        ? Object.values(
                                            task.selectedTraits
                                          ).reduce(
                                            (acc: number, curr: any[]) => {
                                              return (
                                                acc +
                                                curr.filter((trait) =>
                                                  trait.availableInMarketplaces
                                                    .map((m: any) =>
                                                      m.toLowerCase()
                                                    )
                                                    .includes(marketplace)
                                                ).length
                                              );
                                            },
                                            0
                                          )
                                        : task.tokenIds?.length || 1;

                                    return (
                                      <div
                                        key={`bids-${marketplace}`}
                                        className={`flex justify-between px-3 py-2 rounded ${
                                          marketplace === "opensea"
                                            ? "bg-[#2081e2]/10"
                                            : marketplace === "blur"
                                            ? "bg-[#FF8700]/10"
                                            : "bg-[#e42575]/10"
                                        }`}
                                      >
                                        <div
                                          className={`${
                                            marketplace === "opensea"
                                              ? "text-[#2081e2]"
                                              : marketplace === "blur"
                                              ? "text-[#FF8700]"
                                              : "text-[#e42575]"
                                          }`}
                                        >
                                          {marketplace === "opensea"
                                            ? "OS"
                                            : marketplace === "magiceden"
                                            ? "ME"
                                            : marketplace}
                                        </div>
                                        <div className="flex gap-3">
                                          <span className="opacity-70">
                                            Active:
                                          </span>
                                          <span>
                                            {isMergedTask(task)
                                              ? task.bidStats.bidCounts[
                                                  task._id
                                                ][
                                                  marketplace as
                                                    | "opensea"
                                                    | "blur"
                                                    | "magiceden"
                                                ]
                                              : 0}{" "}
                                            / {total}
                                          </span>
                                          <span className="opacity-50">|</span>
                                          <span className="opacity-70">
                                            Skip:
                                          </span>
                                          <span>
                                            {isMergedTask(task)
                                              ? task.bidStats.skipCounts[
                                                  task._id
                                                ][
                                                  marketplace as
                                                    | "opensea"
                                                    | "blur"
                                                    | "magiceden"
                                                ]
                                              : 0}{" "}
                                            / {total}
                                          </span>
                                          <span className="opacity-50">|</span>
                                          <span className="opacity-70">
                                            Error:
                                          </span>
                                          <span>
                                            {isMergedTask(task)
                                              ? task.bidStats.errorCounts[
                                                  task._id
                                                ][
                                                  marketplace as
                                                    | "opensea"
                                                    | "blur"
                                                    | "magiceden"
                                                ]
                                              : 0}{" "}
                                            / {total}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })
                              : "--"}
                          </div>
                        </td>
                      )}
                      <td className="px-3 py-4 text-center w-[120px]">
                        {getBidType(task)}
                      </td>
                      <td className="px-3 py-4 text-center w-[120px]">
                        <div className="flex flex-col">
                          {task.bidPrice.min &&
                          task.bidPrice.minType &&
                          task.bidPriceType === GENERAL_BID_PRICE ? (
                            <span>
                              {task.bidPrice.min}{" "}
                              {task.bidPrice.minType === "percentage"
                                ? "%"
                                : "ETH".toUpperCase()}
                            </span>
                          ) : null}

                          {task.openseaBidPrice.min &&
                          task.openseaBidPrice.minType &&
                          task.bidPriceType === MARKETPLACE_BID_PRICE ? (
                            <span className="text-[#2081e2]">
                              {task.openseaBidPrice.min}{" "}
                              {task.openseaBidPrice.minType === "percentage"
                                ? "%"
                                : "WETH".toUpperCase()}
                            </span>
                          ) : null}

                          {task.blurBidPrice.min &&
                          task.blurBidPrice.minType &&
                          task.bidPriceType === MARKETPLACE_BID_PRICE ? (
                            <span className="text-[#FF8700]">
                              {task.blurBidPrice.min}{" "}
                              {task.blurBidPrice.minType === "percentage"
                                ? "%"
                                : "BETH".toUpperCase()}
                            </span>
                          ) : null}

                          {task.magicEdenBidPrice.min &&
                          task.magicEdenBidPrice.minType &&
                          task.bidPriceType === MARKETPLACE_BID_PRICE ? (
                            <span className="text-[#e42575]">
                              {task.magicEdenBidPrice.min}{" "}
                              {task.magicEdenBidPrice.minType === "percentage"
                                ? "%"
                                : "WETH".toUpperCase()}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center w-[100px]">
                        <span className="sm:hidden font-bold">OpenSea</span>
                        <Toggle
                          checked={task.selectedMarketplaces.includes(
                            "OpenSea"
                          )}
                          onChange={() => {
                            if (
                              !task.selectedMarketplaces.includes("OpenSea") &&
                              !task.slugValid
                            )
                              return;
                            onToggleMarketplace(task._id, "OpenSea");
                          }}
                          activeColor="#2081e2"
                          inactiveColor="#3F3F46"
                        />
                      </td>
                      <td className="px-3 py-4 text-center w-[100px]">
                        <span className="sm:hidden font-bold">Blur</span>
                        <Toggle
                          checked={task.selectedMarketplaces.includes("Blur")}
                          onChange={() => {
                            if (
                              !task.selectedMarketplaces.includes("Blur") &&
                              (!task.blurValid || task.bidType === "token")
                            )
                              return;
                            onToggleMarketplace(task._id, "Blur");
                          }}
                          activeColor="#FF8700"
                          inactiveColor="#3F3F46"
                        />
                      </td>
                      <td className="px-3 py-4 text-center w-[100px]">
                        <span className="sm:hidden font-bold">MagicEden</span>
                        <Toggle
                          checked={task.selectedMarketplaces.includes(
                            "MagicEden"
                          )}
                          onChange={() => {
                            if (
                              !task.selectedMarketplaces.includes(
                                "MagicEden"
                              ) &&
                              !task.magicEdenValid
                            )
                              return;
                            onToggleMarketplace(task._id, "MagicEden");
                          }}
                          activeColor="#e42575"
                          inactiveColor="#3F3F46"
                        />
                      </td>
                      <td className="px-3 py-4 text-center w-[100px]">
                        <span className="sm:hidden font-bold">Tags</span>
                        <div className="flex flex-wrap gap-1 items-center justify-center">
                          {task.tags.map((tag) => (
                            <span
                              key={tag.name}
                              style={{ backgroundColor: tag.color }}
                              className="w-5 h-5 rounded-full"
                            ></span>
                          ))}
                        </div>
                      </td>

                      {isVerificationMode ? null : (
                        <td className="px-3 py-4 text-center w-[100px]">
                          <span className="sm:hidden font-bold">Start</span>
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={task.running}
                              onChange={() => {
                                onToggleTaskStatus(task._id);
                                const message = {
                                  endpoint: "toggle-status",
                                  data: task,
                                };
                                sendMessage && sendMessage(message);
                              }}
                            />
                            <div
                              className={`relative w-11 h-6 bg-gray-200 rounded-full transition-colors duration-200 ease-in-out ${
                                task.running ? "!bg-Brand/Brand-1" : ""
                              }`}
                            >
                              <div
                                className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${
                                  task.running ? "transform translate-x-5" : ""
                                }`}
                              ></div>
                            </div>
                          </label>
                        </td>
                      )}
                      <td className="px-3 py-4 text-center w-[80px]">
                        <span className="sm:hidden font-bold">Edit</span>
                        <div className="flex items-center justify-end sm:justify-center">
                          <button onClick={() => onEditTask(task)}>
                            <EditIcon />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center w-[80px]">
                        <span className="sm:hidden font-bold">Delete</span>
                        <div className="flex items-center justify-end sm:justify-center">
                          <button onClick={() => handleDeleteClick(task)}>
                            <DeleteIcon />
                          </button>
                        </div>
                      </td>
                      {isVerificationMode && (
                        <td className="px-3 py-4 text-center w-[80px]">
                          {(!task.wallet?.address ||
                            !task.wallet?.privateKey) && (
                            <div
                              className="flex items-center justify-center"
                              title="Missing wallet information"
                            >
                              ⚠️
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        taskSlugs={taskToDelete?.contract.slug || ""}
      />
    </>
  );
};

export default TaskTable;

interface TaskTableProps {
  tasks: Task[];
  selectedTasks: string[];
  selectAll: boolean;
  onToggleSelectAll: () => void;
  onToggleTaskSelection: (taskId: string) => void;
  onToggleTaskStatus: (taskId: string) => void;
  onToggleMarketplace: (taskId: string, marketplace: string) => void;
  onEditTask: (task: Task) => void;
  filterText: string;
  selectedTags: Tag[];
  selectedBidTypes?: ("COLLECTION" | "TOKEN" | "TRAIT")[]; // Make this prop optional
  isVerificationMode?: boolean;
  mergedTasks?: MergedTask[];
  bidStats?: BidStats;
  totalBids?: {
    opensea: number;
    blur: number;
    magiceden: number;
  };
  skipBids?: {
    opensea: number;
    blur: number;
    magiceden: number;
  };
  errorBids?: {
    opensea: number;
    blur: number;
    magiceden: number;
  };
  sendMessage?: (message: any) => void;
}
