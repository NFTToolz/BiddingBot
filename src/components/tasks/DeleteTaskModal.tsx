import Modal from "../common/Modal";
import { useTaskStore } from "../../store/task.store";
import { toast } from "react-toastify";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskSlugs: string[] | string;
  isImportedTask?: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  taskSlugs,
  isImportedTask = false,
}) => {
  const handleConfirm = () => {
    if (isImportedTask) {
      const taskStore = useTaskStore.getState();
      const slugArray = Array.isArray(taskSlugs) ? taskSlugs : [taskSlugs];
      slugArray.forEach((slug) => taskStore.deleteImportedTask(slug));
      toast.success("Imported tasks deleted successfully");
    } else {
      onConfirm();
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        <h3 className="text-lg font-medium mb-4">
          Delete {isImportedTask ? "Imported " : ""}Tasks
        </h3>
        <p className="mb-4">
          Are you sure you want to delete the following tasks?
        </p>
        <div className="max-h-40 overflow-y-auto custom-scrollbar mb-6">
          {taskSlugs &&
            (Array.isArray(taskSlugs) ? taskSlugs : [taskSlugs]).map((slug) => (
              <div key={slug} className="py-1 px-2 rounded mb-1">
                <span className="text-[#7364DB]">{slug}</span>
              </div>
            ))}
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#313442] hover:bg-[#2C2C35] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteModal;
