import { FC, useEffect, useRef } from "react";
import ReactDOM from "react-dom";

const MODAL_ROOT_ID = "modal-root";
const OVERLAY_CLASS =
  "fixed inset-0 flex items-center justify-center bg-opacity-75 z-[9999] bg-n-8";
const MODAL_CLASS =
  "relative shadow-lg w-[95%] max-w-[520px] max-h-[90vh] bg-[#1F2128] p-6 rounded-2xl overflow-y-auto";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "auto";
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className={OVERLAY_CLASS}>
      <div
        ref={modalRef}
        className={`${MODAL_CLASS} ${className} custom-scrollbar`} // Add custom-scrollbar class here
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[#F1F1F1]"
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        {children}
      </div>
    </div>,
    document.getElementById(MODAL_ROOT_ID) || document.body
  );
};

export default Modal;
