"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import TaskTable from "@/components/tasks/TaskTable";
import TaskModal from "@/components/tasks/TaskModal";
import { useTaskStore, Task } from "@/store/task.store";
import React from "react";
import { toast } from "react-toastify";
import { useWebSocket } from "@/app/context/WebSocketContext";

const ImportVerification = () => {
  const router = useRouter();
  const { importedTasks, clearImportedTasks, addTask } = useTaskStore();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [selectedTasks, setSelectedTasks] = React.useState<string[]>([]);
  const [selectAll, setSelectAll] = React.useState(false);

  const { sendMessage } = useWebSocket();

  // Redirect if no imported tasks
  useEffect(() => {
    if (!importedTasks.length) {
      router.push("/dashboard/tasks");
    }
  }, [importedTasks, router]);

  const handleConfirmImport = async () => {
    try {
      const tasksToImport = importedTasks.filter((task) =>
        selectedTasks.includes(task._id)
      );
      tasksToImport.forEach((task) => {
        addTask(task);
      });

      const response = await fetch("/api/task/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tasksToImport),
        credentials: "include",
      });

      sendMessage({
        endpoint: "import-tasks",
        data: tasksToImport,
      });

      if (!response.ok) {
        throw new Error("Failed to import tasks");
      }

      clearImportedTasks();
      toast.success("Tasks imported successfully!");
      router.push("/dashboard/tasks");
    } catch (error) {
      console.error("Failed to save imported tasks:", error);
    }
  };

  const handleCancelImport = () => {
    clearImportedTasks();
    router.push("/dashboard/tasks");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleToggleMarketplace = (taskId: string, marketplace: string) => {
    const task = importedTasks.find((t) => t._id === taskId);
    if (task) {
      const updatedMarketplaces = task.selectedMarketplaces.includes(
        marketplace
      )
        ? task.selectedMarketplaces.filter((m) => m !== marketplace)
        : [...task.selectedMarketplaces, marketplace];

      useTaskStore.getState().editImportedTask(taskId, {
        selectedMarketplaces: updatedMarketplaces,
      });
    }
  };

  const handleToggleTaskSelection = (taskId: string) => {
    const task = importedTasks.find((t) => t._id === taskId);
    // Only allow selection if wallet info is complete
    if (!task?.wallet?.address || !task?.wallet?.privateKey) return;

    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleToggleSelectAll = () => {
    // Filter tasks that have complete wallet info
    const selectableTasks = importedTasks.filter(
      (task) => task.wallet?.address && task.wallet?.privateKey
    );

    if (selectAll) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(selectableTasks.map((task) => task._id));
    }
    setSelectAll(!selectAll);
  };

  return (
    <section className="ml-4 p-4 sm:p-6 pb-24">
      <div className="flex flex-col items-center justify-between mb-4 sm:mb-8 pb-4 sm:flex-row">
        <h1 className="text-xl font-bold mb-4 sm:mb-0 sm:text-2xl md:text-[28px]">
          Verify Imported Tasks
        </h1>
        <div className="flex gap-4">
          <button
            className="dashboard-button"
            onClick={handleConfirmImport}
            disabled={importedTasks.length === 0}
          >
            Confirm Import
          </button>
          <button
            className="dashboard-button !bg-[#ef4444]"
            onClick={handleCancelImport}
          >
            Cancel Import
          </button>
        </div>
      </div>

      <TaskTable
        tasks={importedTasks}
        selectedTasks={selectedTasks}
        selectAll={selectAll}
        onToggleSelectAll={handleToggleSelectAll}
        onToggleTaskSelection={handleToggleTaskSelection}
        onToggleTaskStatus={() => {}}
        onToggleMarketplace={handleToggleMarketplace}
        onEditTask={(task) => {
          setEditingTask(task);
          setIsModalOpen(true);
        }}
        filterText=""
        selectedTags={[]}
        selectedBidTypes={[]}
        isVerificationMode={true}
      />

      <TaskModal
        isOpen={isModalOpen}
        onClose={closeModal}
        taskId={editingTask?._id}
        initialTask={editingTask}
        isVerificationMode={true}
      />
    </section>
  );
};

export default ImportVerification;
