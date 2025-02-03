import React, { useState, useEffect, useMemo } from "react";
import { Task } from "@/store/task.store";
import Toggle from "@/components/common/Toggle";
import EditIcon from "@/assets/svg/EditIcon";
import { Tag } from "@/store/tag.store";
import Link from "next/link";
import DeleteIcon from "@/assets/svg/DeleteIcon";
import { useTaskStore } from "@/store/task.store";
import { toast } from "react-toastify";
import DeleteModal from "./DeleteTaskModal";
import { MergedTask } from "@/app/dashboard/tasks/page";
import { BidStats } from "@/app/context/WebSocketContext";

const GENERAL_BID_PRICE = "GENERAL_BID_PRICE";
const MARKETPLACE_BID_PRICE = "MARKETPLACE_BID_PRICE";

const getMarketplaceUrls = (slug: string, bidType: string) => ({
  opensea:
    bidType === "COLLECTION"
      ? `https://opensea.io/collection/${slug}/offers`
      : `https://opensea.io/collection/${slug}/activity?activityTypes=${
          bidType === "TOKEN"
            ? "offer"
            : bidType === "TRAIT"
            ? "trait_offer"
            : "collection_offer"
        }`,
  blur: `https://blur.io/collection/${slug}/bids`,
  magiceden: `https://magiceden.io/collections/ethereum/${slug}?activeTab=offers`,
});

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

  console.log({ bidStats });

  return (
    <>
      {isVerificationMode ? null : (
        <>
          <div className="flex my-4 gap-4 text-sm">
            <p>Bid Stats</p>
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

                <th scope="col" className="px-3 py-3 text-center w-[180px]">
                  Bid Amount
                </th>
                {isVerificationMode ? null : (
                  <>
                    <th scope="col" className="px-3 py-3 text-center w-[250px]">
                      <div className="flex flex-col gap-3">
                        <span className="text-sm font-medium">
                          Bid Stats & Status
                        </span>
                        <div className="flex items-center justify-center gap-4 bg-[#2A2B32] p-2 rounded-lg">
                          {["opensea", "blur", "magiceden"].map(
                            (marketplace) => (
                              <div
                                key={marketplace}
                                className="flex items-center gap-2"
                              >
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    marketplace === "opensea"
                                      ? "bg-[#2081e2]"
                                      : marketplace === "blur"
                                      ? "bg-[#FF8700]"
                                      : "bg-[#e42575]"
                                  }`}
                                ></div>
                                <span
                                  className={`text-xs ${
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
                                    : "Blur"}
                                </span>
                                <Toggle
                                  checked={tasks.some((task) =>
                                    task.selectedMarketplaces.includes(
                                      marketplace === "opensea"
                                        ? "OpenSea"
                                        : marketplace === "magiceden"
                                        ? "MagicEden"
                                        : "Blur"
                                    )
                                  )}
                                  onChange={() => {
                                    tasks.forEach((task) => {
                                      onToggleMarketplace(
                                        task._id,
                                        marketplace === "opensea"
                                          ? "OpenSea"
                                          : marketplace === "magiceden"
                                          ? "MagicEden"
                                          : "Blur"
                                      );
                                    });
                                  }}
                                  activeColor={
                                    marketplace === "opensea"
                                      ? "#2081e2"
                                      : marketplace === "blur"
                                      ? "#FF8700"
                                      : "#e42575"
                                  }
                                  inactiveColor="#3F3F46"
                                />
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </th>
                  </>
                )}
                <th scope="col" className="px-3 py-3 text-center w-[120px]">
                  Bid Type
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
                  console.log({ task });
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
                                  : task.contract.slug,

                                getBidType(task)
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
                                      {isMergedTask(task)
                                        ? task.bidStats.floorPrices[task._id][
                                            marketplace.toLowerCase() as
                                              | "opensea"
                                              | "blur"
                                              | "magiceden"
                                          ].toFixed(3)
                                        : 0}{" "}
                                      Ξ
                                    </span>
                                    <span className="opacity-50">|</span>
                                    <span className="opacity-70">Best:</span>
                                    <span>
                                      {isMergedTask(task)
                                        ? task.bidStats.bestOffers?.[
                                            task._id
                                          ]?.[
                                            marketplace.toLowerCase() as
                                              | "opensea"
                                              | "blur"
                                              | "magiceden"
                                          ].toFixed(3)
                                        : 0}{" "}
                                      Ξ
                                    </span>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center w-[180px]">
                        <p className="mb-4 leading-6 opacity-0 text-sm underline">
                          Hello World
                        </p>
                        <div className="flex flex-col gap-2 text-sm">
                          {task.selectedMarketplaces.length > 0
                            ? task.selectedMarketplaces
                                .sort()
                                .map((marketplace) => {
                                  const marketplaceKey =
                                    marketplace.toLowerCase() === "magiceden"
                                      ? "magicEden"
                                      : marketplace.toLowerCase();
                                  const floorPrice = isMergedTask(task)
                                    ? task.bidStats.floorPrices[task._id][
                                        marketplace.toLowerCase() as
                                          | "opensea"
                                          | "blur"
                                          | "magiceden"
                                      ].toFixed(3)
                                    : 0;

                                  let minValue, maxValue;
                                  let bidPrice;

                                  if (task.bidPriceType === GENERAL_BID_PRICE) {
                                    bidPrice = task.bidPrice;
                                  } else if (
                                    task.bidPriceType === MARKETPLACE_BID_PRICE
                                  ) {
                                    bidPrice = {
                                      min: (
                                        task[
                                          `${marketplaceKey}BidPrice` as keyof typeof task
                                        ] as {
                                          min: number;
                                          max: number;
                                          minType: string;
                                          maxType: string;
                                        }
                                      )?.min,
                                      max: (
                                        task[
                                          `${marketplaceKey}BidPrice` as keyof typeof task
                                        ] as {
                                          min: number;
                                          max: number;
                                          minType: string;
                                          maxType: string;
                                        }
                                      )?.max,
                                      minType: (
                                        task[
                                          `${marketplaceKey}BidPrice` as keyof typeof task
                                        ] as {
                                          min: number;
                                          max: number;
                                          minType: string;
                                          maxType: string;
                                        }
                                      )?.minType,
                                      maxType: (
                                        task[
                                          `${marketplaceKey}BidPrice` as keyof typeof task
                                        ] as {
                                          min: number;
                                          max: number;
                                          minType: string;
                                          maxType: string;
                                        }
                                      )?.maxType,
                                    };
                                  }

                                  if (
                                    bidPrice?.min &&
                                    bidPrice?.minType === "percentage" &&
                                    floorPrice
                                  ) {
                                    minValue = (
                                      (+floorPrice * bidPrice.min) /
                                      100
                                    ).toFixed(4);
                                  } else {
                                    minValue = bidPrice?.min;
                                  }

                                  if (
                                    bidPrice?.max &&
                                    bidPrice?.maxType === "percentage" &&
                                    floorPrice
                                  ) {
                                    maxValue = (
                                      (+floorPrice * bidPrice.max) /
                                      100
                                    ).toFixed(4);
                                  } else {
                                    maxValue = bidPrice?.max;
                                  }

                                  return (
                                    <div
                                      key={`price-${marketplace}`}
                                      className={`flex justify-between px-3 py-2 rounded ${
                                        marketplaceKey === "opensea"
                                          ? "bg-[#2081e2]/10"
                                          : marketplaceKey === "blur"
                                          ? "bg-[#FF8700]/10"
                                          : "bg-[#e42575]/10"
                                      }`}
                                    >
                                      <div
                                        className={`mr-4 ${
                                          marketplaceKey === "opensea"
                                            ? "text-[#2081e2]"
                                            : marketplaceKey === "blur"
                                            ? "text-[#FF8700]"
                                            : "text-[#e42575]"
                                        }`}
                                      >
                                        {marketplace.toLowerCase() === "opensea"
                                          ? "OS"
                                          : marketplace.toLowerCase() ===
                                            "magiceden"
                                          ? "ME"
                                          : marketplace}
                                      </div>
                                      <div className="flex gap-3">
                                        <span className="opacity-70">Min:</span>
                                        <span>
                                          {minValue || "--"}
                                          {bidPrice?.minType === "percentage" &&
                                          !floorPrice
                                            ? "%"
                                            : "Ξ"}
                                        </span>
                                        <span className="opacity-50">|</span>
                                        <span className="opacity-70">Max:</span>
                                        <span>
                                          {maxValue || "--"}
                                          {bidPrice?.maxType === "percentage" &&
                                          !floorPrice
                                            ? "%"
                                            : "Ξ"}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })
                            : "--"}
                        </div>
                      </td>

                      {isVerificationMode ? null : (
                        <td className="px-3 py-4 text-center w-[250px]">
                          <p className="mb-4 leading-6 opacity-0 text-sm underline">
                            Hello World
                          </p>
                          <div className="flex flex-col gap-3">
                            {/* Marketplace Stats */}
                            <div className="flex flex-col gap-2 text-sm">
                              {["blur", "magiceden", "opensea"].map(
                                (marketplace) => {
                                  const isSelected =
                                    task.selectedMarketplaces.includes(
                                      marketplace === "opensea"
                                        ? "OpenSea"
                                        : marketplace === "magiceden"
                                        ? "MagicEden"
                                        : "Blur"
                                    );

                                  return (
                                    <div
                                      key={`stats-${marketplace}`}
                                      className={`flex justify-between px-3 py-2 rounded ${
                                        marketplace === "opensea"
                                          ? "bg-[#2081e2]/10"
                                          : marketplace === "blur"
                                          ? "bg-[#FF8700]/10"
                                          : "bg-[#e42575]/10"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`w-2 h-2 rounded-full ${
                                            marketplace === "opensea"
                                              ? "bg-[#2081e2]"
                                              : marketplace === "blur"
                                              ? "bg-[#FF8700]"
                                              : "bg-[#e42575]"
                                          }`}
                                        />
                                        <span
                                          className={
                                            marketplace === "opensea"
                                              ? "text-[#2081e2]"
                                              : marketplace === "blur"
                                              ? "text-[#FF8700]"
                                              : "text-[#e42575]"
                                          }
                                        >
                                          {marketplace === "opensea"
                                            ? "OS"
                                            : marketplace === "magiceden"
                                            ? "ME"
                                            : marketplace}
                                        </span>
                                        <Toggle
                                          checked={isSelected}
                                          onChange={() => {
                                            if (
                                              marketplace === "blur" &&
                                              !task.selectedMarketplaces.includes(
                                                "Blur"
                                              ) &&
                                              (!task.blurValid ||
                                                task.bidType === "token")
                                            )
                                              return;
                                            onToggleMarketplace(
                                              task._id,
                                              marketplace === "opensea"
                                                ? "OpenSea"
                                                : marketplace === "magiceden"
                                                ? "MagicEden"
                                                : "Blur"
                                            );
                                          }}
                                          activeColor={
                                            marketplace === "opensea"
                                              ? "#2081e2"
                                              : marketplace === "blur"
                                              ? "#FF8700"
                                              : "#e42575"
                                          }
                                          inactiveColor="#3F3F46"
                                        />
                                      </div>
                                      <div className="flex gap-3">
                                        <span className="opacity-70">
                                          Active:
                                        </span>
                                        <span>
                                          {isSelected && isMergedTask(task)
                                            ? task.bidStats.bidCounts[task._id][
                                                marketplace as
                                                  | "opensea"
                                                  | "blur"
                                                  | "magiceden"
                                              ]
                                            : 0}{" "}
                                        </span>
                                        <span className="opacity-50">|</span>
                                        <span className="opacity-70">
                                          Skip:
                                        </span>
                                        <span>
                                          {isSelected && isMergedTask(task)
                                            ? task.bidStats.skipCounts[
                                                task._id
                                              ][
                                                marketplace as
                                                  | "opensea"
                                                  | "blur"
                                                  | "magiceden"
                                              ]
                                            : 0}
                                        </span>
                                        <span className="opacity-50">|</span>
                                        <span className="opacity-70">
                                          Error:
                                        </span>
                                        <span>
                                          {isSelected && isMergedTask(task)
                                            ? task.bidStats.errorCounts[
                                                task._id
                                              ][
                                                marketplace as
                                                  | "opensea"
                                                  | "blur"
                                                  | "magiceden"
                                              ]
                                            : 0}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        </td>
                      )}

                      <td className="px-3 py-4 text-center w-[120px]">
                        {getBidType(task)}
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
