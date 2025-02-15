"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import TaskModal from "@/components/tasks/TaskModal";
import { useTaskStore, Task } from "@/store/task.store";
import React from "react";
import TaskTable from "@/components/tasks/TaskTable";
import { BidInfo } from "@/interface";
import TagFilter from "@/components/tasks/TagFilter";
import { Tag } from "@/store/tag.store";
import { BidStats, useWebSocket } from "@/app/context/WebSocketContext";
import BidTypeFilter, { BidType } from "@/components/tasks/BidTypeFilter";
import FilterInput from "@/components/tasks/FilterInput";
import DownloadIcon from "@/assets/svg/DownloadIcon";
import UploadIcon from "@/assets/svg/UploadIcon";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import DeleteModal from "@/components/tasks/DeleteTaskModal";
import { toast } from "react-toastify";
import RetryIcon from "@/assets/svg/RetryIcon";
import Link from "next/link";
import SettingsModal from "@/components/settings/SettingsModal";
import { useSettingsStore } from "@/store/settings.store";
import DisconnectIcon from "@/assets/svg/DisconnectIcon";
import PowerIcon from "@/assets/svg/PowerIcon";
import UpdateIcon from "@/assets/svg/UpdateIcon";

const processJSONImport = (jsonData: any): Partial<Task>[] => {
  if (Array.isArray(jsonData)) {
    return jsonData;
  }
  return [jsonData];
};

const Tasks = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    tasks,
    setTasks,
    toggleTaskRunning,
    toggleMultipleTasksRunning,
    addImportedTasks,
  } = useTaskStore();
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [duplicateTask, setDuplicateTask] = useState<Task | null>(null);
  const [bids, setBids] = useState<BidInfo[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(20);
  const [filterText, setFilterText] = useState("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [selectedBidTypes, setSelectedBidTypes] = useState<BidType[]>([]);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const { settings } = useSettingsStore();
  const {
    sendMessage,
    wsConnectionStatus,
    retryConnection,
    taskLockData,
    bidStats,
    isConnected,
  } = useWebSocket();
  const router = useRouter();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch("/api/task", {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch tasks");
        const fetchedTasks = await response.json();

        setTasks(fetchedTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    fetchTasks();
  }, [setTasks]);

  const filteredTasks = tasks.filter((task) => {
    const matchesSlug = task.contract.slug
      .toLowerCase()
      .includes(filterText.toLowerCase());
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) =>
        task.tags.some((taskTag) => taskTag.name === tag.name)
      );
    const bidType =
      Object.keys(task?.selectedTraits || {}).length > 0
        ? "TRAIT"
        : task.bidType === "token" && task.tokenIds.length > 0
        ? "TOKEN"
        : task.bidType.toUpperCase();
    const matchesBidType =
      selectedBidTypes.length === 0 ||
      selectedBidTypes.includes(bidType as any);
    return matchesSlug && matchesTags && matchesBidType;
  });

  const mergedTasks = useMemo(() => {
    return filteredTasks.map(
      (task): MergedTask => ({
        ...task,
        bidStats: {
          bidRates: {
            opensea: {
              bidsPerSecond: 0,
              totalBids: 0,
              windowPeriod: 0,
            },
            magiceden: {
              bidsPerSecond: 0,
              totalBids: 0,
              windowPeriod: 0,
            },
            blur: {
              bidsPerSecond: 0,
              totalBids: 0,
              windowPeriod: 0,
            },
          },
          bidCounts: {
            [task._id]: (bidStats?.bidCounts &&
              bidStats.bidCounts[task._id]) || {
              opensea: 0,
              magiceden: 0,
              blur: 0,
            },
          },
          floorPrices: {
            [task._id]: (bidStats?.floorPrices &&
              bidStats.floorPrices[task._id]) || {
              opensea: 0,
              magiceden: 0,
              blur: 0,
            },
          },
          bestOffers: {
            [task._id]: (bidStats?.bestOffers &&
              bidStats.bestOffers[task._id]) || {
              opensea: 0,
              magiceden: 0,
              blur: 0,
            },
          },
          skipCounts: {
            [task._id]: (bidStats?.skipCounts &&
              bidStats.skipCounts[task._id]) || {
              opensea: 0,
              magiceden: 0,
              blur: 0,
            },
          },
          errorCounts: {
            [task._id]: (bidStats?.errorCounts &&
              bidStats.errorCounts[task._id]) || {
              opensea: 0,
              magiceden: 0,
              blur: 0,
            },
          },

          warningBids: {
            [task._id]: (bidStats?.warningBids &&
              bidStats.warningBids[task._id]) || {
              opensea: false,
              magiceden: false,
              blur: false,
            },
          },
        },
      })
    );
  }, [filteredTasks, bidStats]);

  const totalBids = useMemo(() => {
    return {
      opensea: Object.values(bidStats?.bidCounts || {}).reduce(
        (sum, stats) => sum + (stats.opensea || 0),
        0
      ),
      blur: Object.values(bidStats?.bidCounts || {}).reduce(
        (sum, stats) => sum + (stats.blur || 0),
        0
      ),
      magiceden: Object.values(bidStats?.bidCounts || {}).reduce(
        (sum, stats) => sum + (stats.magiceden || 0),
        0
      ),
    };
  }, [bidStats]);

  const skipBids = useMemo(() => {
    return {
      opensea: Object.values(bidStats?.skipCounts || {}).reduce(
        (sum, stats) => sum + (stats.opensea || 0),
        0
      ),
      blur: Object.values(bidStats?.skipCounts || {}).reduce(
        (sum, stats) => sum + (stats.blur || 0),
        0
      ),
      magiceden: Object.values(bidStats?.skipCounts || {}).reduce(
        (sum, stats) => sum + (stats.magiceden || 0),
        0
      ),
    };
  }, [bidStats]);

  const errorBids = useMemo(() => {
    return {
      opensea: Object.values(bidStats?.errorCounts || {}).reduce(
        (sum, stats) => sum + (stats.opensea || 0),
        0
      ),
      blur: Object.values(bidStats?.errorCounts || {}).reduce(
        (sum, stats) => sum + (stats.blur || 0),
        0
      ),
      magiceden: Object.values(bidStats?.errorCounts || {}).reduce(
        (sum, stats) => sum + (stats.magiceden || 0),
        0
      ),
    };
  }, [bidStats]);

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks((prev) => {
      const newSelection = prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId];
      setSelectAll(newSelection.length === tasks.length);
      return newSelection;
    });
  };

  const toggleSelectedTasksStatus = (running: boolean) => {
    toggleMultipleTasksRunning(selectedTasks, running);
    const selectedTaskDetails = tasks.filter((task) =>
      selectedTasks.includes(task._id)
    );
    sendMessage({
      endpoint: "update-multiple-tasks-status",
      data: { tasks: selectedTaskDetails, running },
    });
  };

  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    setSelectedTasks(selectAll ? [] : tasks.map((task) => task._id));
  };

  const openEditModal = React.useCallback((task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  }, []);

  const onDuplicateTask = React.useCallback((task: Task) => {
    setDuplicateTask(task);
    setIsModalOpen(true);
  }, []);

  const closeModal = React.useCallback(() => {
    setIsModalOpen(false);
    setEditingTask(null);
  }, []);

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

  const indexOfLastOffer = currentPage * recordsPerPage;
  const indexOfFirstOffer = indexOfLastOffer - recordsPerPage;
  const currentBids = bids.slice(indexOfFirstOffer, indexOfLastOffer);
  const totalPages = Math.ceil(bids.length / recordsPerPage);

  const paginate = React.useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
  }, []);

  const renderPageNumbers = React.useCallback(() => {
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

  const tasksToExport = tasks.filter((task) =>
    selectedTasks.includes(task._id)
  );

  const exportAsJSON = () => {
    const sanitizedTasks = tasksToExport.map((task) => {
      const taskWithoutWallet = {
        ...task,
        wallet: {
          address: task.wallet.address,
          privateKey: "",
          blurApproval: false,
          openseaApproval: false,
          magicedenApproval: false,
        },
      };
      return taskWithoutWallet;
    });
    const dataStr = JSON.stringify(sanitizedTasks, null, 2);
    downloadFile(dataStr, "tasks.json", "application/json");
    setShowExportDropdown(false);
  };

  const exportAsCSV = () => {
    const sanitizedTasks = tasksToExport.map((task) => {
      const taskWithoutWallet = {
        ...task,
        wallet: {
          address: task.wallet.address,
          privateKey: "",
          blurApproval: false,
          openseaApproval: false,
          magicedenApproval: false,
        },
      };
      return taskWithoutWallet;
    });

    const processedData = processData(sanitizedTasks);

    if (processedData.length === 0) return;

    const headers = Object.keys(processedData[0]);
    const csvContent = [
      headers.join(","),
      ...processedData.map((row: Record<string, any>) =>
        headers
          .map((header) => {
            const value = row[header];
            const cellValue =
              value === null || value === undefined ? "" : String(value);
            return `"${cellValue.replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    downloadFile(csvContent, "tasks.csv", "text/csv;charset=utf-8;");
  };

  const downloadFile = (
    content: string,
    fileName: string,
    contentType: string
  ) => {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportButton = (
    <div className="relative inline-block">
      <button
        className="dashboard-button !bg-n-13"
        onClick={() => setShowExportDropdown(!showExportDropdown)}
        disabled={selectedTasks.length === 0}
      >
        <div className="flex items-center justify-between w-full gap-4">
          <span>Export Selected</span>
          <DownloadIcon />
        </div>
      </button>
      {showExportDropdown && (
        <div className="absolute z-10 mt-1 border rounded-lg shadow-lg border-Neutral-BG-[night] bg-Neutral/Neutral-300-[night] max-h-60 overflow-y-auto custom-scrollbar whitespace-nowrap w-full min-w-[195px]">
          <div
            onClick={exportAsJSON}
            className="cursor-pointer p-3 transition-colors hover:bg-Neutral/Neutral-400-[night]"
          >
            Export as JSON
          </div>
          <div
            onClick={exportAsCSV}
            className="cursor-pointer p-3 transition-colors hover:bg-Neutral/Neutral-400-[night]"
          >
            Export as CSV
          </div>
        </div>
      )}
    </div>
  );

  const handleImportTasks = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        let tasks: Partial<Task>[];

        if (file.name.endsWith(".json")) {
          const jsonData = JSON.parse(text);
          tasks = processJSONImport(jsonData);
        } else if (file.name.endsWith(".csv")) {
          tasks = convertCSVToTasks(text);
        } else {
          throw new Error("Unsupported file format");
        }

        addImportedTasks(tasks);
        router.push("/dashboard/import-verification");
      } catch (error) {
        console.error("Error importing tasks:", error);
      }

      event.target.value = "";
    },
    [addImportedTasks, router]
  );

  const importButton = (
    <div className="relative">
      <input
        type="file"
        accept=".json,.csv"
        onChange={handleImportTasks}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <button className="dashboard-button !bg-n-13">
        <div className="flex items-center justify-between w-full gap-4">
          <span>Import Task</span>
          <UploadIcon />
        </div>
      </button>
    </div>
  );

  const deleteSelectedTasks = async () => {
    try {
      const response = await fetch("/api/task", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedTasks }),
        credentials: "include",
      });

      const tasksToDelete = tasks.filter((task) =>
        selectedTasks.includes(task._id)
      );

      if (!response.ok) throw new Error("Failed to delete tasks");

      setTasks(tasks.filter((task) => !selectedTasks.includes(task._id)));
      for (const task of tasksToDelete) {
        sendMessage({
          endpoint: "stop-task",
          data: task,
        });
      }
      setSelectedTasks([]);
      setSelectAll(false);
      toast.success("Tasks deleted successfully");
    } catch (error) {
      console.error("Error deleting tasks:", error);
      toast.error("Failed to delete tasks");
    }
  };

  // Get slugs of selected tasks
  const selectedTaskSlugs = tasks
    .filter((task) => selectedTasks.includes(task._id))
    .map((task) => task.contract.slug);

  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const rateLimit = process.env.NEXT_PUBLIC_RATE_LIMIT;

  useEffect(() => {
    if (!settings.apiKey && !apiKey) {
      toast.warning("Please set your API key in Settings to create tasks");
    } else if (!settings.rateLimit && !rateLimit) {
      toast.warning("Please set your rate limit in Settings to create tasks");
    }
  }, [settings.apiKey, settings.rateLimit]);

  return (
    <section className="ml-4 p-4 sm:p-6 pb-24">
      <div className="absolute top-0 right-12 flex items-center gap-4 mb-8">
        <RetryIcon retryConnection={retryConnection} />
        <p>server status</p>
        {wsConnectionStatus === "connected" ? (
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
        ) : wsConnectionStatus === "connecting" ? (
          <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
        ) : (
          <div className="w-4 h-4 rounded-full bg-red-500"></div>
        )}
      </div>

      {!isConnected ? (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <DisconnectIcon size={240} color="#AEB9E1" />
          <p className="mt-4 text-lg text-gray-600">
            Connection lost. Reconnecting...
          </p>
        </div>
      ) : (
        <div className={!isConnected ? "pointer-events-none opacity-50" : ""}>
          <div className="flex flex-col items-center justify-between mb-4 sm:mb-8 pb-4 sm:flex-row mt-8">
            <h1 className="text-xl font-bold mb-4 sm:mb-0 sm:text-2xl md:text-[28px]">
              Manage Tasks
            </h1>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  sendMessage({ endpoint: "update" });
                }}
                className={`min-w-[166px] bg-Brand/Brand-1 px-6 py-3 rounded-md flex items-center gap-2 justify-center`}
              >
                <UpdateIcon width={24} height={24} />
                <span className="text-white text-sm">Update</span>
              </button>
              <button
                onClick={() => {
                  sendMessage({ endpoint: "shutdown" });
                }}
                className={`min-w-[166px] ${
                  isConnected ? "bg-red-500" : "bg-Brand/Brand-1"
                } px-6 py-3 rounded-md flex items-center gap-2 justify-center`}
              >
                <PowerIcon width={24} height={24} />
                <span className="text-white text-sm">Power</span>
              </button>
              <button
                className="dashboard-button"
                onClick={() => setIsModalOpen(true)}
                disabled={!settings.apiKey || !settings.rateLimit}
                title={
                  !settings.apiKey
                    ? "API Key required"
                    : !settings.rateLimit
                    ? "Rate limit required"
                    : ""
                }
              >
                Create New Task
              </button>
              {importButton}
            </div>
          </div>
          <div className="mb-4 flex justify-start gap-4">
            <Link
              href="/dashboard/wallet"
              className="text-Brand/Brand-1 underline font-semibold"
            >
              Manage Wallet
            </Link>
            <button
              className="text-Brand/Brand-1 underline font-semibold"
              onClick={() => setIsSettingsModalOpen(true)}
            >
              Settings
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 justify-between items-center">
            <div className="flex gap-2 sm:gap-4">
              <FilterInput
                placeholder="Filter by slug"
                value={filterText}
                onChange={setFilterText}
              />
              <TagFilter
                selectedTags={selectedTags}
                onChange={setSelectedTags}
              />
              <BidTypeFilter
                selectedBidTypes={selectedBidTypes}
                onChange={setSelectedBidTypes}
              />
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                className="dashboard-button"
                onClick={() => toggleSelectedTasksStatus(true)}
                disabled={selectedTasks.length === 0}
              >
                Start Selected
              </button>
              <button
                className="dashboard-button !bg-[#ef4444]"
                onClick={() => toggleSelectedTasksStatus(false)}
                disabled={selectedTasks.length === 0}
              >
                Stop Selected
              </button>
              <button
                className="dashboard-button !bg-[#ef4444]"
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={selectedTasks.length === 0}
              >
                Delete Selected
              </button>
              {exportButton}
            </div>
          </div>

          <TaskTable
            tasks={tasks}
            selectedTasks={selectedTasks}
            selectAll={selectAll}
            onToggleSelectAll={toggleSelectAll}
            onToggleTaskSelection={toggleTaskSelection}
            onToggleTaskStatus={toggleTaskRunning}
            onToggleMarketplace={toggleMarketplace}
            onEditTask={openEditModal}
            filterText={filterText}
            selectedTags={selectedTags}
            selectedBidTypes={selectedBidTypes}
            mergedTasks={mergedTasks}
            totalBids={totalBids}
            errorBids={errorBids}
            sendMessage={sendMessage}
            bidStats={bidStats as BidStats}
            skipBids={skipBids}
            setIsModalOpen={setIsModalOpen}
            onDuplicateTask={onDuplicateTask}
          />
          <TaskModal
            isOpen={isModalOpen}
            onClose={closeModal}
            taskId={editingTask?._id}
            initialTask={editingTask}
            duplicateTask={duplicateTask}
          />
          <DeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={deleteSelectedTasks}
            taskSlugs={selectedTaskSlugs}
          />
          <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
          />
        </div>
      )}
    </section>
  );
};

export default Tasks;

function determineMarketplace(domain: string): string {
  switch (domain) {
    case "opensea.io":
      return "OS";
    case "blur.io":
      return "Blur";
    case "magiceden.io":
      return "Magic Eden";
    default:
      return "Unknown";
  }
}

const processData = (data: Task[]) => {
  const baseFields = [
    "contract.slug",
    "contract.contractAddress",
    "wallet.address",
    "outbidOptions.outbid",
    "outbidOptions.blurOutbidMargin",
    "outbidOptions.openseaOutbidMargin",
    "outbidOptions.magicedenOutbidMargin",
    "outbidOptions.counterbid",
    "bidPrice.min",
    "bidPrice.max",
    "bidPrice.minType",
    "bidPrice.maxType",
    "openseaBidPrice.min",
    "openseaBidPrice.max",
    "openseaBidPrice.minType",
    "openseaBidPrice.maxType",
    "blurBidPrice.min",
    "blurBidPrice.max",
    "blurBidPrice.minType",
    "blurBidPrice.maxType",
    "magicEdenBidPrice.min",
    "magicEdenBidPrice.max",
    "magicEdenBidPrice.minType",
    "magicEdenBidPrice.maxType",
    "stopOptions.minFloorPrice",
    "stopOptions.maxFloorPrice",
    "stopOptions.minTraitPrice",
    "stopOptions.maxTraitPrice",
    "stopOptions.maxPurchase",
    "stopOptions.pauseAllBids",
    "stopOptions.stopAllBids",
    "stopOptions.cancelAllBids",
    "stopOptions.triggerStopOptions",
    "bidDuration.value",
    "bidDuration.unit",
    "selectedMarketplaces",
    "running",
    "bidType",
    "bidPriceType",
    "slugValid",
    "magicEdenValid",
    "blurValid",
    "openseaValid",
    "balance",
  ];

  const getNestedValue = (obj: Record<string, any>, path: string): any => {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : "";
    }, obj);
  };

  return data.map((item) => {
    const row = {};

    baseFields.forEach((field) => {
      let value = getNestedValue(item, field);
      if (Array.isArray(value)) {
        value = JSON.stringify(value);
      }
      (row as Record<string, any>)[field] = value;
    });

    (row as Record<string, any>)["tokenIds"] = JSON.stringify(
      item.tokenIds || []
    );

    if (item.selectedTraits) {
      (row as Record<string, any>)["selectedTraits"] = JSON.stringify(
        item.selectedTraits
      );
    }

    if (item.traits) {
      (row as Record<string, any>)["traits"] = JSON.stringify(item.traits);
    }

    return row;
  });
};

const convertCSVToTasks = (csvContent: string): Task[] => {
  const { data } = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  return data.map((row: any) => {
    const selectedTraits = JSON.parse(row.selectedTraits || "{}");
    const traits = JSON.parse(row.traits || "{}");
    const tokenIds = JSON.parse(row.tokenIds || "[]");
    const selectedMarketplaces = JSON.parse(row.selectedMarketplaces || "[]");

    const stringToBoolean = (value: string) => value.toLowerCase() === "true";

    const stringToNumberOrNull = (value: string) => {
      if (value === "" || value === "null") return null;
      const num = Number(value);
      return isNaN(num) ? null : num;
    };

    const task: Task = {
      _id: row._id || crypto.randomUUID(),
      user: row.user || "",
      contract: {
        slug: row["contract.slug"] || "",
        contractAddress: row["contract.contractAddress"] || "",
      },
      wallet: {
        address: row["wallet.address"] || "",
        privateKey: "",
        openseaApproval: false,
        blurApproval: false,
        magicedenApproval: false,
      },
      selectedMarketplaces,
      running: stringToBoolean(row.running),
      tags: [{ name: "token bid", color: "#e7c208" }],
      selectedTraits,
      traits,
      outbidOptions: {
        outbid: stringToBoolean(row["outbidOptions.outbid"]),
        blurOutbidMargin: stringToNumberOrNull(
          row["outbidOptions.blurOutbidMargin"]
        ),
        openseaOutbidMargin: stringToNumberOrNull(
          row["outbidOptions.openseaOutbidMargin"]
        ),
        magicedenOutbidMargin: stringToNumberOrNull(
          row["outbidOptions.magicedenOutbidMargin"]
        ),
        counterbid: stringToBoolean(row["outbidOptions.counterbid"]),
      },
      bidPrice: {
        min: Number(row["bidPrice.min"]) || 0,
        max: stringToNumberOrNull(row["bidPrice.max"]),
        minType: row["bidPrice.minType"] as "percentage" | "eth",
        maxType: row["bidPrice.maxType"] as "percentage" | "eth",
      },
      openseaBidPrice: {
        min: Number(row["openseaBidPrice.min"]) || 0,
        max: stringToNumberOrNull(row["openseaBidPrice.max"]),
        minType: row["openseaBidPrice.minType"] as "percentage" | "eth",
        maxType: row["openseaBidPrice.maxType"] as "percentage" | "eth",
      },
      blurBidPrice: {
        min: Number(row["blurBidPrice.min"]) || 0,
        max: stringToNumberOrNull(row["blurBidPrice.max"]),
        minType: row["blurBidPrice.minType"] as "percentage" | "eth",
        maxType: row["blurBidPrice.maxType"] as "percentage" | "eth",
      },
      magicEdenBidPrice: {
        min: Number(row["magicEdenBidPrice.min"]) || 0,
        max: stringToNumberOrNull(row["magicEdenBidPrice.max"]),
        minType: row["magicEdenBidPrice.minType"] as "percentage" | "eth",
        maxType: row["magicEdenBidPrice.maxType"] as "percentage" | "eth",
      },
      stopOptions: {
        minFloorPrice: stringToNumberOrNull(row["stopOptions.minFloorPrice"]),
        maxFloorPrice: stringToNumberOrNull(row["stopOptions.maxFloorPrice"]),
        minTraitPrice: stringToNumberOrNull(row["stopOptions.minTraitPrice"]),
        maxTraitPrice: stringToNumberOrNull(row["stopOptions.maxTraitPrice"]),
        maxPurchase: stringToNumberOrNull(row["stopOptions.maxPurchase"]),
        pauseAllBids: stringToBoolean(row["stopOptions.pauseAllBids"]),
        stopAllBids: stringToBoolean(row["stopOptions.stopAllBids"]),
        cancelAllBids: stringToBoolean(row["stopOptions.cancelAllBids"]),
        triggerStopOptions: stringToBoolean(
          row["stopOptions.triggerStopOptions"]
        ),
      },
      bidDuration: {
        value: Number(row["bidDuration.value"]) || 0,
        unit: row["bidDuration.unit"] || "",
      },
      tokenIds,
      bidType: row.bidType || "",
      loopInterval: {
        value: Number(row["loopInterval.value"]) || 0,
        unit: row["loopInterval.unit"] || "",
      },
      bidPriceType: row.bidPriceType || "",
      slugValid: stringToBoolean(row.slugValid),
      magicEdenValid: stringToBoolean(row.magicEdenValid),
      blurValid: stringToBoolean(row.blurValid),
      openseaValid: stringToBoolean(row.openseaValid),
      balance: Number(row.balance) || 0,
    };

    return task;
  });
};

export interface MergedTask extends Task {
  bidStats: BidStats;
}

interface BidRates {
  opensea: MarketplaceBidRate;
  blur: MarketplaceBidRate;
  magiceden: MarketplaceBidRate;
}

interface MarketplaceBidRate {
  bidsPerSecond: number;
  totalBids: number;
  windowPeriod: number;
}
