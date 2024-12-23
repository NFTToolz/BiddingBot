import ChevronDown from "@/assets/svg/ChevronDown";
import { useState, useEffect } from "react";
import { useWalletStore } from "@/store/wallet.store";
import { toast } from "react-toastify";
import DeleteIcon from "@/assets/svg/DeleteIcon";

export type CustomSelectOption = {
  value: string;
  label: string;
  address?: string;
  etherBalance?: string;
  wethBalance?: string;
  blurBalance?: string;
};

interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showDeleteWallet?: boolean;
}

const CustomSelect = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className = "",
  showDeleteWallet = false,
}: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [enrichedOptions, setEnrichedOptions] = useState(options);
  const deleteWallet = useWalletStore((state) => state.deleteWallet);

  useEffect(() => {
    const fetchBalances = async (address: string) => {
      try {
        const response = await fetch(`/api/wallet/balance/${address}`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch balances");
        const data = await response.json();

        return {
          etherBalance: `${Number(data.eth).toFixed(4)} ETH`,
          wethBalance: `${Number(data.weth).toFixed(4)} WETH`,
          blurBalance: `${Number(data.beth).toFixed(4)} BETH`,
        };
      } catch (error) {
        console.error("Error fetching balances:", error);
        return null;
      }
    };

    const updateOptionsWithBalances = async () => {
      const updatedOptions = await Promise.all(
        options.map(async (option) => {
          if (!option.address) return option;

          const balances = await fetchBalances(option.address);
          if (!balances) return option;

          return {
            ...option,
            ...balances,
          };
        })
      );

      setEnrichedOptions(updatedOptions);
    };

    updateOptionsWithBalances();
  }, [options]);

  const handleDeleteWallet = async (e: React.MouseEvent, walletId: string) => {
    e.stopPropagation();

    try {
      const response = await fetch(`/api/wallet/${walletId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete wallet");
      }

      deleteWallet(walletId);
      toast.success("Wallet deleted successfully");
    } catch (error) {
      toast.error("Failed to delete wallet");
      console.error("Error deleting wallet:", error);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        className="w-full min-w-20 border rounded-lg shadow-sm p-3 border-Neutral-BG-[night] bg-Neutral/Neutral-300-[night] text-left flex justify-between items-center hover:bg-Neutral/Neutral-400-[night] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {value ? (
          <span>
            {enrichedOptions.find((opt) => opt.value === value)?.label}
          </span>
        ) : (
          placeholder
        )}
        <ChevronDown />
      </button>
      {isOpen && (
        <ul className="absolute z-10 w-full mt-1 border rounded-lg shadow-lg border-Neutral-BG-[night] bg-Neutral/Neutral-300-[night]">
          {enrichedOptions.map((option) => (
            <li
              key={option.value}
              className="p-4 cursor-pointer transition-colors hover:bg-Brand/Brand-1 flex justify-between items-center"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <div className="hover:text-Primary-500-[night] transition-colors flex-grow">
                <div className="text-sm">{option.label}</div>
                {option.address && (
                  <div className="text-xs text-Neutral/Neutral-600-[night]">
                    {option.address
                      ? `${option.address.slice(
                          0,
                          6
                        )} ... ${option.address.slice(-4)}`
                      : ""}
                  </div>
                )}
                <div className="flex flex-col gap-1 text-sm mt-2">
                  {option.etherBalance && (
                    <div className="text-sm text-Neutral/Neutral-600-[night]">
                      {option.etherBalance}
                    </div>
                  )}
                  {option.wethBalance && (
                    <div className="text-sm text-Neutral/Neutral-600-[night]">
                      {option.wethBalance}
                    </div>
                  )}
                  {option.blurBalance && (
                    <div className="text-sm text-Neutral/Neutral-600-[night]">
                      {option.blurBalance}
                    </div>
                  )}
                </div>
              </div>
              {showDeleteWallet && (
                <button
                  onClick={(e) => handleDeleteWallet(e, option.value)}
                  className="p-2 hover:text-red-500 transition-colors"
                >
                  <DeleteIcon />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect;
