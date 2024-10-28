"use client";
import CancelIcon from "@/assets/svg/CancelIcon";
import EditIcon from "@/assets/svg/EditIcon";
import Toggle from "@/components/common/Toggle";
import MarketplaceFilter, {
  Marketplace,
} from "@/components/tasks/MarketplaceFilter";
import TaskModal from "@/components/tasks/TaskModal";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Task, useTaskStore } from "@/store";
import { useCallback, useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const NEXT_PUBLIC_SERVER_WEBSOCKET = process.env
  .NEXT_PUBLIC_SERVER_WEBSOCKET as string;

function formatTimeRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} ${days === 1 ? "day" : "days"}`;
  } else if (hours > 0) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  } else if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  } else {
    return `${seconds} ${seconds === 1 ? "second" : "seconds"}`;
  }
}

export default function Page({ params }: { params: { slug: string } }) {
  const [selectAll, setSelectAll] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [recordsPerPage, setRecordsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<
    Marketplace[]
  >([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { tasks, toggleTaskRunning } = useTaskStore();
  const { sendMessage } = useWebSocket(NEXT_PUBLIC_SERVER_WEBSOCKET);

  const {
    data,
    error,
    isLoading,
  }: {
    data: OfferData[];
    error: any;
    isLoading: boolean;
  } = useSWR(`/api/progress/${params.slug}`, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 1000,
  });

  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    setSelectedTasks(selectAll ? [] : data.map((task) => task.value));
  };

  const toggleBid = (value: string) => {
    setSelectedTasks((prev) => {
      const newSelection = prev.includes(value)
        ? prev.filter((id) => id !== value)
        : [...prev, value];
      setSelectAll(newSelection.length === data.length);
      return newSelection;
    });
  };

  const paginate = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
  }, []);

  const filteredBids = data?.filter(
    (bid) =>
      selectedMarketplaces.length === 0 ||
      selectedMarketplaces.includes(bid.marketplace as Marketplace)
  );

  const indexOfLastOffer = currentPage * recordsPerPage;
  const totalPages = Math.ceil(filteredBids?.length / recordsPerPage) ?? 1;
  const indexOfFirstOffer = indexOfLastOffer - recordsPerPage;
  const currentBids =
    filteredBids?.slice(indexOfFirstOffer, indexOfLastOffer) ?? [];

  const renderPageNumbers = useCallback(() => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => paginate(i)}
          className={`px-3 py-1 rounded ${
            currentPage === i
              ? "bg-Brand/Brand-1 text-white"
              : "bg-gray-700 text-white"
          }`}
        >
          {i}
        </button>
      );
    }
    return pageNumbers;
  }, [currentPage, totalPages, paginate]);

  const task = tasks.find(
    (item) => item.contract.slug.toLowerCase() === params.slug.toLowerCase()
  );

  const toggleMarketplace = (taskId: string, marketplace: string) => {
    const task = tasks.find((t) => t._id === taskId);
    if (task) {
      const updatedMarketplaces = task.selectedMarketplaces.includes(
        marketplace
      )
        ? task.selectedMarketplaces.filter((m) => m !== marketplace)
        : [...task.selectedMarketplaces, marketplace];

      const updatedTask = useTaskStore
        .getState()
        .editTask(taskId, { selectedMarketplaces: updatedMarketplaces });

      try {
        const message = { endpoint: "update-marketplace", data: updatedTask };
        sendMessage(message);

        fetch(`/api/task/${taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedTask),
          credentials: "include",
        });
      } catch (error) {
        console.error("Error updating marketplace:", error);
      }
    }
  };

  const openEditModal = useCallback((task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingTask(null);
  }, []);

  return (
    <section className="ml-0 sm:ml-20 p-4 sm:p-6 pb-24">
      Task: {params.slug} ({data?.length} SUCCESSFUL BIDS)
      <div className="flex items-center justify-between my-4">
        <MarketplaceFilter
          selectedMarketplaces={selectedMarketplaces}
          onChange={setSelectedMarketplaces}
        />
        <button
          className="w-full sm:w-auto dashboard-btn uppercase bg-red-500 text-xs py-3 px-4 sm:text-sm sm:px-6 md:px-8"
          onClick={() => {}}
        >
          Cancel Selected
        </button>
      </div>
      <div className="flex justify-between my-8 items-center">
        <div className="flex gap-4 items-center">
          <div className="flex gap-2 items-center">
            <h4 className="text-sm font-normal">OS</h4>
            <Toggle
              checked={task?.selectedMarketplaces.includes("OpenSea") ?? false}
              onChange={() => task && toggleMarketplace(task._id, "OpenSea")}
              activeColor="#2081e2"
              inactiveColor="#3F3F46"
              disabled={!task?.slugValid}
            />
          </div>

          {task?.bidType !== "token" && (
            <div className="flex gap-2 items-center">
              <h4 className="text-sm font-normal">Blur</h4>
              <Toggle
                checked={task?.selectedMarketplaces.includes("Blur") ?? false}
                onChange={() => task && toggleMarketplace(task._id, "Blur")}
                activeColor="#FF8700"
                inactiveColor="#3F3F46"
                disabled={!task?.blurValid || task.bidType === "token"}
              />
            </div>
          )}

          <div className="flex gap-2 items-center">
            <h4 className="text-sm font-normal">Magiceden</h4>
            <Toggle
              checked={
                task?.selectedMarketplaces.includes("MagicEden") ?? false
              }
              onChange={() => task && toggleMarketplace(task._id, "MagicEden")}
              activeColor="#e42575"
              inactiveColor="#3F3F46"
              disabled={!task?.magicEdenValid}
            />
          </div>

          <div className="px-2 sm:px-6 py-2 sm:py-4 text-left sm:text-center flex items-center justify-between sm:table-cell">
            <span className="sm:hidden font-bold">Edit</span>
            <div className="flex items-center justify-end sm:justify-center">
              <button onClick={() => task && openEditModal(task)}>
                <EditIcon />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <h4 className="font-normal text-sm">
            {task?.running ? "STOP" : "START"}
          </h4>
          <div className="px-2 sm:px-6 py-2 sm:py-4 text-left sm:text-center flex items-center justify-between">
            <span className="sm:hidden font-bold">Start</span>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={task?.running ?? false}
                onChange={() => {
                  if (task?._id) {
                    // Add null check
                    toggleTaskRunning(task._id);
                    const message = {
                      endpoint: "toggle-status",
                      data: task,
                    };
                    sendMessage(message);
                  }
                }}
              />
              <div
                className={`relative w-11 h-6 bg-gray-200 rounded-full transition-colors duration-200 ease-in-out ${
                  task?.running ? "!bg-Brand/Brand-1" : ""
                }`}
              >
                <div
                  className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${
                    task?.running ? "transform translate-x-5" : ""
                  }`}
                ></div>
              </div>
            </label>
          </div>
        </div>
      </div>
      <div className="border rounded-2xl py-3 sm:py-5 px-2 sm:px-6 bg-[#1f2129] border-Neutral/Neutral-Border-[night] h-full overflow-x-auto mt-8">
        <table className="w-full text-sm text-left">
          <thead className="hidden sm:table-header-group">
            <tr className="border-b border-Neutral/Neutral-Border-[night]">
              <th scope="col" className="px-6 py-3 text-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selectAll}
                    onChange={toggleSelectAll}
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
              <th scope="col" className="px-6 py-3 text-center">
                marketplace
              </th>
              <th scope="col" className="px-6 py-3 text-center">
                name
              </th>
              <th scope="col" className="px-6 py-3 text-center">
                offer price
              </th>
              <th scope="col" className="px-6 py-3 text-center">
                Expires In
              </th>
              <th scope="col" className="px-6 py-3 text-center">
                Cancel Bid
              </th>
            </tr>
          </thead>
          <tbody>
            {currentBids &&
              currentBids?.length > 0 &&
              currentBids?.map((bid, index) => {
                return (
                  <tr
                    key={index}
                    className="border-b border-Neutral/Neutral-Border-[night] flex flex-col sm:table-row mb-4 sm:mb-0"
                  >
                    <td className="py-2 px-2 sm:px-4 text-left sm:text-center flex items-center justify-between sm:table-cell">
                      <span className="sm:hidden font-bold">Select</span>
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={selectedTasks.includes(bid.value)}
                          onChange={() => toggleBid(bid.value)}
                        />
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors duration-200 ease-in-out ${
                            selectedTasks.includes(bid.value)
                              ? "bg-[#7F56D9] border-[#7F56D9]"
                              : "bg-transparent border-gray-400"
                          }`}
                        >
                          {selectedTasks.includes(bid.value) && (
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
                    <td className="py-2 px-2 sm:px-4 text-left sm:text-center flex items-center justify-center sm:table-cell ">
                      <div className="flex gap-2 items-center justify-center">
                        <span
                          className={`w-4 h-4 rounded-full ${
                            bid.marketplace === "opensea"
                              ? "bg-[#2081e2]"
                              : bid.marketplace === "blur"
                              ? "bg-[#FF8700]"
                              : bid.marketplace === "magiceden"
                              ? "bg-[#e42575]"
                              : ""
                          }`}
                        ></span>
                        <div>{bid.marketplace}</div>
                      </div>
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 text-left sm:text-center flex items-end justify-center gap-2 flex-row">
                      <span>{params.slug}</span>
                      <div className="flex flex-row">
                        {(() => {
                          if (
                            typeof bid.identifier === "object" &&
                            bid.identifier !== null
                          ) {
                            switch (bid.marketplace) {
                              case "magiceden":
                                return (
                                  <div className="flex border border-n-4 gap-2">
                                    <span className="border-n-4 border-r px-2 bg-n-5">
                                      {bid.identifier.attributeKey}
                                    </span>
                                    <span className="px-2">
                                      {bid.identifier.attributeValue}
                                    </span>
                                  </div>
                                );
                              case "opensea":
                                return (
                                  <div className="flex border border-n-4 gap-2">
                                    <span className="border-n-4 border-r px-2 bg-n-5">
                                      {bid.identifier.type}
                                    </span>
                                    <span className="px-2">
                                      {bid.identifier.value}
                                    </span>
                                  </div>
                                );
                              case "blur":
                                return (
                                  <div className="flex border border-n-4 gap-2">
                                    <span className="border-n-4 border-r px-2 bg-n-5">
                                      {bid.identifier.type}
                                    </span>
                                    <span className="px-2">
                                      {bid.identifier.value}
                                    </span>
                                  </div>
                                );
                            }
                          } else if (
                            typeof bid.identifier === "string" &&
                            bid.identifier !== "default"
                          ) {
                            const num = Number(bid.identifier);
                            if (!isNaN(num) && isFinite(num)) {
                              return (
                                <span className="px-2 bg-n-5">
                                  {bid.identifier}
                                </span>
                              );
                            }
                          }
                          return null;
                        })()}
                      </div>
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 text-left sm:text-center flex items-center justify-between sm:table-cell">
                      {Number(bid.offerPrice) / 1e18}{" "}
                      {bid.marketplace === "blur" ? "BETH" : "WETH"}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 text-left sm:text-center flex items-center justify-between sm:table-cell">
                      {formatTimeRemaining(bid.ttl)}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 text-left sm:text-center flex items-center justify-between sm:table-cell">
                      <span className="sm:hidden font-bold">Edit</span>
                      <div className="flex items-center justify-end sm:justify-center">
                        <button onClick={() => {}}>
                          <CancelIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Show</span>
          <select
            value={recordsPerPage}
            onChange={(e) => setRecordsPerPage(Number(e.target.value))}
            className="bg-gray-700 text-white rounded px-2 py-1"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-400">Records</span>
        </div>
        <div className="flex flex-wrap justify-center space-x-2">
          <button
            onClick={() => paginate(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
          >
            First
          </button>
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
          >
            Prev
          </button>
          <div className="hidden sm:flex space-x-2">{renderPageNumbers()}</div>
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
          >
            Next
          </button>
          <button
            onClick={() => paginate(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
          >
            Last
          </button>
        </div>
      </div>
      <div className="sm:hidden mt-4 text-center">
        <span className="text-sm text-gray-400">
          Page {currentPage} of {totalPages}
        </span>
      </div>
      <TaskModal
        isOpen={isModalOpen}
        onClose={closeModal}
        taskId={editingTask?._id}
        initialTask={editingTask}
      />
    </section>
  );
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
