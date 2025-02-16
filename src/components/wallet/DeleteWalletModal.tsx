import Modal from "../common/Modal";

interface DeleteWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  walletAddress: string;
  walletName: string;
}

const DeleteWalletModal: React.FC<DeleteWalletModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  walletAddress,
  walletName,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        <h3 className="text-lg font-medium mb-4">Delete Wallet</h3>
        <p className="mb-4">Are you sure you want to delete this wallet?</p>
        <div className="max-h-40 overflow-y-auto custom-scrollbar mb-6">
          <div className="py-1 px-2 rounded mb-1">
            <span className="text-[#7364DB]">{walletName}</span>
            <br />
            <span className="text-sm text-gray-400">
              {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
            </span>
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#313442] hover:bg-[#2C2C35] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteWalletModal;
