import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Wallet } from "./wallet.store";

interface TaskStore {
  tasks: Task[];
  addTask: (task: Task) => void;
  editTask: (id: string, updatedTask: Partial<Task>) => Task;
  deleteTask: (id: string) => void;
  toggleTaskRunning: (id: string) => void;
  toggleMultipleTasksRunning: (ids: string[], running: boolean) => void;
  getLastTaskId: () => string;
  setTasks: (tasks: Task[]) => void;
  importedTasks: Task[];
  addImportedTasks: (tasks: Partial<Task>[]) => void;
  clearImportedTasks: () => void;
  editImportedTask: (id: string, updatedTask: Partial<Task>) => Task;
  deleteImportedTask: (id: string) => void;
}

export const useTaskStore = create(
  persist<TaskStore>(
    (set, get) => ({
      tasks: [],
      addTask: (task) => {
        set((state) => ({
          tasks: [task, ...state.tasks],
        }));
      },
      editTask: (id, updatedTask) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task._id === id
              ? {
                  ...task,
                  ...updatedTask,
                  slugValid: task.slugValid,
                  magicEdenValid: task.magicEdenValid,
                  blurValid: task.blurValid,
                  selectedTraits:
                    updatedTask.selectedTraits || task.selectedTraits,
                  bidDuration: updatedTask.bidDuration ?? task.bidDuration,
                  loopInterval: updatedTask.loopInterval ?? task.loopInterval,
                  bidPrice: {
                    min: updatedTask.bidPrice?.min ?? task.bidPrice.min,
                    max: updatedTask.bidPrice?.max ?? task.bidPrice.max,
                    minType:
                      updatedTask.bidPrice?.minType ?? task.bidPrice.minType,
                    maxType:
                      updatedTask.bidPrice?.maxType ?? task.bidPrice.maxType,
                  },
                  openseaBidPrice: {
                    min:
                      updatedTask.openseaBidPrice?.min ??
                      task.openseaBidPrice.min,
                    max:
                      updatedTask.openseaBidPrice?.max ??
                      task.openseaBidPrice.max,
                    minType:
                      updatedTask.openseaBidPrice?.minType ??
                      task.openseaBidPrice.minType,
                    maxType:
                      updatedTask.openseaBidPrice?.maxType ??
                      task.openseaBidPrice.maxType,
                  },
                  blurBidPrice: {
                    min: updatedTask.blurBidPrice?.min ?? task.blurBidPrice.min,
                    max: updatedTask.blurBidPrice?.max ?? task.blurBidPrice.max,
                    minType:
                      updatedTask.blurBidPrice?.minType ??
                      task.blurBidPrice.minType,
                    maxType:
                      updatedTask.blurBidPrice?.maxType ??
                      task.blurBidPrice.maxType,
                  },
                  magicEdenBidPrice: {
                    min:
                      updatedTask.magicEdenBidPrice?.min ??
                      task.magicEdenBidPrice.min,
                    max:
                      updatedTask.magicEdenBidPrice?.max ??
                      task.magicEdenBidPrice.max,
                    minType:
                      updatedTask.magicEdenBidPrice?.minType ??
                      task.magicEdenBidPrice.minType,
                    maxType:
                      updatedTask.magicEdenBidPrice?.maxType ??
                      task.magicEdenBidPrice.maxType,
                  },
                  outbidOptions: {
                    outbid:
                      updatedTask.outbidOptions?.outbid ??
                      task.outbidOptions.outbid,
                    blurOutbidMargin:
                      updatedTask.outbidOptions?.blurOutbidMargin ??
                      task.outbidOptions.blurOutbidMargin,
                    openseaOutbidMargin:
                      updatedTask.outbidOptions?.openseaOutbidMargin ??
                      task.outbidOptions.openseaOutbidMargin,
                    magicedenOutbidMargin:
                      updatedTask.outbidOptions?.magicedenOutbidMargin ??
                      task.outbidOptions.magicedenOutbidMargin,
                    counterbid:
                      updatedTask.outbidOptions?.counterbid ??
                      task.outbidOptions.counterbid,
                  },
                  stopOptions: {
                    minFloorPrice:
                      updatedTask.stopOptions?.minFloorPrice ??
                      task.stopOptions.minFloorPrice,
                    maxFloorPrice:
                      updatedTask.stopOptions?.maxFloorPrice ??
                      task.stopOptions.maxFloorPrice,
                    minTraitPrice:
                      updatedTask.stopOptions?.minTraitPrice ??
                      task.stopOptions.minTraitPrice,
                    maxTraitPrice:
                      updatedTask.stopOptions?.maxTraitPrice ??
                      task.stopOptions.maxTraitPrice,
                    maxPurchase:
                      updatedTask.stopOptions?.maxPurchase ??
                      task.stopOptions.maxPurchase,
                    pauseAllBids:
                      updatedTask.stopOptions?.pauseAllBids ??
                      task.stopOptions.pauseAllBids,
                    stopAllBids:
                      updatedTask.stopOptions?.stopAllBids ??
                      task.stopOptions.stopAllBids,
                    cancelAllBids:
                      updatedTask.stopOptions?.cancelAllBids ??
                      task.stopOptions.cancelAllBids,
                    triggerStopOptions:
                      updatedTask.stopOptions?.triggerStopOptions ??
                      task.stopOptions.triggerStopOptions,
                  },
                  tokenIds: updatedTask.tokenIds ?? task.tokenIds,
                }
              : task
          ),
        }));

        const task = get().tasks.find((task) => task._id === id) as Task;
        return task;
      },
      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task._id !== id),
        })),
      toggleTaskRunning: async (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task._id === id ? { ...task, running: !task.running } : task
          ),
        }));

        await fetch(`/api/task/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            running: get().tasks.find((task) => task._id === id)?.running,
          }),
        });
      },
      toggleMultipleTasksRunning: async (ids, running) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            return ids.includes(task._id) ? { ...task, running } : task;
          }),
        }));
        await fetch(`/api/task`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids, running }),
        });
      },
      getLastTaskId: () => {
        const state = get();
        return state.tasks[state.tasks.length - 1]?._id;
      },
      setTasks: (tasks) => set({ tasks }),
      importedTasks: [],
      addImportedTasks: async (newTasks) => {
        try {
          // Fetch wallets from API
          const response = await fetch("/api/wallet");
          if (!response.ok) {
            throw new Error("Failed to fetch wallets");
          }
          const wallets: Wallet[] = await response.json();

          set({
            importedTasks: newTasks.map((task) => {
              const existingWallet = wallets.find(
                (w) =>
                  w.address.toLowerCase() ===
                  task.wallet?.address?.toLowerCase()
              );

              return {
                ...task,
                _id: crypto.randomUUID(),
                user: "",
                running: false,
                traits: task.traits || { categories: {}, counts: {} },
                wallet: existingWallet || {
                  address: "",
                  privateKey: "",
                  openseaApproval: false,
                  blurApproval: false,
                  magicedenApproval: false,
                },
              } as Task;
            }),
          });
        } catch (error) {
          console.error("Error fetching wallets:", error);
          // If fetch fails, proceed with empty wallet details
          set({
            importedTasks: newTasks.map(
              (task) =>
                ({
                  ...task,
                  _id: crypto.randomUUID(),
                  user: "",
                  running: false,
                  traits: task.traits || { categories: {}, counts: {} },
                  wallet: {
                    address: "",
                    privateKey: "",
                    openseaApproval: false,
                    blurApproval: false,
                    magicedenApproval: false,
                  },
                } as Task)
            ),
          });
        }
      },
      clearImportedTasks: () => {
        set({ importedTasks: [] });
      },
      editImportedTask: (id, updatedTask) => {
        set((state) => ({
          importedTasks: state.importedTasks.map((task) =>
            task._id === id
              ? {
                  ...task,
                  ...updatedTask,
                  slugValid: task.slugValid,
                  magicEdenValid: task.magicEdenValid,
                  blurValid: task.blurValid,
                }
              : task
          ),
        }));

        const task = get().importedTasks.find(
          (task) => task._id === id
        ) as Task;
        return task;
      },
      deleteImportedTask: (id) =>
        set((state) => ({
          importedTasks: state.importedTasks.filter((task) => task._id !== id),
        })),
    }),
    {
      name: "tasks",
    }
  )
);

export interface Task {
  _id: string;
  user: string;
  contract: {
    slug: string;
    contractAddress: string;
  };
  wallet: {
    address: string;
    privateKey: string;
    openseaApproval: boolean;
    blurApproval: boolean;
    magicedenApproval: boolean;
  };
  selectedMarketplaces: string[];
  running: boolean;
  tags: { name: string; color: string }[];
  selectedTraits: Record<
    string,
    { name: string; availableInMarketplaces: string[] }[]
  >;
  traits: {
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
  };
  outbidOptions: {
    outbid: boolean;
    blurOutbidMargin: number | null;
    openseaOutbidMargin: number | null;
    magicedenOutbidMargin: number | null;
    counterbid: boolean;
  };
  bidPrice: {
    min: number;
    max: number | null;
    minType: "percentage" | "eth";
    maxType: "percentage" | "eth";
  };

  openseaBidPrice: {
    min: number;
    max: number | null;
    minType: "percentage" | "eth";
    maxType: "percentage" | "eth";
  };

  blurBidPrice: {
    min: number;
    max: number | null;
    minType: "percentage" | "eth";
    maxType: "percentage" | "eth";
  };

  magicEdenBidPrice: {
    min: number;
    max: number | null;
    minType: "percentage" | "eth";
    maxType: "percentage" | "eth";
  };

  stopOptions: {
    minFloorPrice: number | null;
    maxFloorPrice: number | null;
    minTraitPrice: number | null;
    maxTraitPrice: number | null;
    maxPurchase: number | null;
    pauseAllBids: boolean;
    stopAllBids: boolean;
    cancelAllBids: boolean;
    triggerStopOptions: boolean;
  };
  bidDuration: { value: number; unit: string };
  tokenIds: (number | string)[];
  bidType: string;
  loopInterval: { value: number; unit: string };
  bidPriceType: string;
  slugValid: boolean;
  magicEdenValid: boolean;
  blurValid: boolean;
}
