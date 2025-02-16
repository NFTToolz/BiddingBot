import React, { useState, useEffect, useRef } from "react";
import ChevronDown from "@/assets/svg/ChevronDown";

export type BidType = "COLLECTION" | "TOKEN" | "TRAIT";

interface BidTypeFilterProps {
  selectedBidTypes: BidType[];
  onChange: (bidTypes: BidType[]) => void;
}

const BidTypeFilter: React.FC<BidTypeFilterProps> = ({
  selectedBidTypes,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const bidTypes: BidType[] = ["COLLECTION", "TOKEN", "TRAIT"];

  const toggleBidType = (bidType: BidType) => {
    if (selectedBidTypes.includes(bidType)) {
      onChange(selectedBidTypes.filter((type) => type !== bidType));
    } else {
      onChange([...selectedBidTypes, bidType]);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        className="border rounded-lg shadow-sm p-3 border-[#3F3A52] bg-[#2C2C35] text-left flex items-center hover:bg-Neutral/Neutral-400-[night] transition-colors min-h-[50px] whitespace-nowrap w-full min-w-[195px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="text-[#9691A4] mr-2 flex-grow">
          {selectedBidTypes.length > 0
            ? selectedBidTypes.join(", ")
            : "Filter by bid type"}
        </div>
        <ChevronDown className="flex-shrink-0" />
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-1 border rounded-lg shadow-lg border-[#1F2128] bg-[#2C2C35] max-h-60 overflow-y-auto custom-scrollbar whitespace-nowrap w-full min-w-[195px]">
          {bidTypes.map((bidType) => (
            <div
              key={bidType}
              onClick={() => toggleBidType(bidType)}
              className={`cursor-pointer p-3 transition-colors hover:bg-Neutral/Neutral-400-[night] ${
                selectedBidTypes.includes(bidType) ? "bg-[#7364DB]" : ""
              }`}
            >
              {bidType}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BidTypeFilter;
