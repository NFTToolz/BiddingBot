import React, { useState, useRef, useEffect } from "react";
import ChevronDown from "@/assets/svg/ChevronDown";
import "./task.css";

interface TraitSelectorProps {
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
  onTraitSelect: (
    selectedTraits: Record<
      string,
      { name: string; availableInMarketplaces: string[] }[]
    >
  ) => void;
  initialSelectedTraits?: Record<
    string,
    { name: string; availableInMarketplaces: string[] }[]
  >;
}

const TraitSelector: React.FC<TraitSelectorProps> = ({
  traits,
  onTraitSelect,
  initialSelectedTraits = {},
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedTraits, setSelectedTraits] = useState<
    Record<string, { name: string; availableInMarketplaces: string[] }[]>
  >(initialSelectedTraits);

  const toggleCategory = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const filteredTraits =
    selectedCategory && traits.counts[selectedCategory]
      ? Object.entries(traits.counts[selectedCategory])
          .filter(([trait]) =>
            trait.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .sort((a, b) => a[1].count - b[1].count)
      : [];

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

  const handleTraitToggle = (category: string, trait: string) => {
    const updatedTraits = { ...selectedTraits };
    if (!updatedTraits[category]) {
      updatedTraits[category] = [];
    }
    const index = updatedTraits[category].findIndex((t) => t.name === trait);
    const availableInMarketplaces =
      traits.counts[category][trait]?.availableInMarketplaces || [];
    if (index > -1) {
      updatedTraits[category].splice(index, 1);
    } else {
      updatedTraits[category].push({
        name: trait,
        availableInMarketplaces,
      });
    }
    if (updatedTraits[category].length === 0) {
      delete updatedTraits[category];
    }
    setSelectedTraits(updatedTraits);
    onTraitSelect(updatedTraits);
  };

  const getSelectedTraitsCount = () => {
    return Object.values(selectedTraits).reduce(
      (acc, traits) => acc + traits.length,
      0
    );
  };

  const isCategorySelected = (category: string) => {
    return selectedTraits[category] && selectedTraits[category].length > 0;
  };

  const areAllTraitsSelected = (category: string) => {
    if (!traits.counts[category] || !selectedTraits[category]) return false;
    const totalTraits = Object.keys(traits.counts[category]).length;
    return selectedTraits[category].length === totalTraits;
  };

  const handleSelectAllTraits = (category: string) => {
    const updatedTraits = { ...selectedTraits };

    if (areAllTraitsSelected(category)) {
      delete updatedTraits[category];
    } else {
      updatedTraits[category] = Object.entries(traits.counts[category]).map(
        ([trait, data]) => ({
          name: trait,
          availableInMarketplaces: data.availableInMarketplaces,
        })
      );
    }

    setSelectedTraits(updatedTraits);
    onTraitSelect(updatedTraits);
  };

  const handleSelectAll = () => {
    const allTraits: Record<
      string,
      { name: string; availableInMarketplaces: string[] }[]
    > = {};

    Object.keys(traits.categories).forEach((category) => {
      if (traits.counts[category]) {
        allTraits[category] = Object.entries(traits.counts[category]).map(
          ([trait, data]) => ({
            name: trait,
            availableInMarketplaces: data.availableInMarketplaces,
          })
        );
      }
    });

    setSelectedTraits(allTraits);
    onTraitSelect(allTraits);
  };

  const handleClearAll = () => {
    setSelectedTraits({});
    onTraitSelect({});
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 border rounded-lg shadow-sm p-3 border-[#1F2128] bg-[#2C2C35] text-left flex justify-between items-center hover:bg-Neutral/Neutral-400-[night] transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>
            {getSelectedTraitsCount() > 0
              ? `${getSelectedTraitsCount()} traits selected`
              : "Select traits"}
          </span>
          <ChevronDown />
        </button>
        <>
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-4 border rounded-lg shadow-sm border-[#1F2128] bg-[#2C2C35] hover:bg-Neutral/Neutral-400-[night] transition-colors"
          >
            Select All
          </button>
          {getSelectedTraitsCount() > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-4 border rounded-lg shadow-sm border-[#1F2128] bg-[#2C2C35] hover:bg-Neutral/Neutral-400-[night] transition-colors"
            >
              Clear
            </button>
          )}
        </>
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 border rounded-lg shadow-lg border-[#1F2128] bg-[#2C2C35] max-h-80 overflow-y-auto custom-scrollbar p-0.5">
          <div className="sticky top-0 z-20 bg-[#2C2C35]">
            <input
              type="text"
              placeholder="Search traits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded w-full p-3 bg-[#15131D]"
            />
          </div>

          <div className="max-h-72 overflow-y-auto">
            {Object.keys(traits.categories).map((category) => (
              <div
                key={category}
                className={`mb-2 ${
                  isCategorySelected(category) ? "bg-highlight" : ""
                }`}
              >
                <div
                  onClick={() => toggleCategory(category)}
                  className={`cursor-pointer p-3 transition-colors my-2 hover:bg-Neutral/Neutral-400-[night] ${
                    isCategorySelected(category) ? "bg-[#7364DB]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="relative mr-2">
                        <input
                          type="checkbox"
                          checked={areAllTraitsSelected(category)}
                          className="sr-only"
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectAllTraits(category);
                          }}
                        />
                        <div
                          className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center ${
                            areAllTraitsSelected(category)
                              ? "bg-[#7364DB] border-[#7364DB]"
                              : "border-gray-400"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAllTraits(category);
                          }}
                        >
                          {areAllTraitsSelected(category) && (
                            <svg
                              className="w-3 h-3 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </div>
                      </div>
                      <span>{category}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">
                        {traits.counts[category] &&
                          Object.keys(traits.counts[category]).length}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          selectedCategory === category ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>
                </div>
                {selectedCategory === category && (
                  <div className="ml-4">
                    {filteredTraits.map(([trait, count]) => (
                      <div
                        key={trait}
                        onClick={() => handleTraitToggle(category, trait)}
                        className="cursor-pointer p-3 transition-colors my-2 hover:bg-[#7364DB] flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <div className="relative mr-2">
                            <input
                              type="checkbox"
                              checked={
                                selectedTraits[category]?.some(
                                  (t) => t.name === trait
                                ) || false
                              }
                              className="sr-only"
                              onChange={() => {}} // Add empty onChange to suppress React warning
                            />
                            <div
                              className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center ${
                                selectedTraits[category]?.some(
                                  (t) => t.name === trait
                                )
                                  ? "bg-[#7364DB] border-[#7364DB]"
                                  : "border-gray-400"
                              }`}
                            >
                              {selectedTraits[category]?.some(
                                (t) => t.name === trait
                              ) && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </div>
                          </div>
                          <span>{trait}</span>
                          {/* Display availableInMarketplaces */}
                          <div className="ml-4 flex gap-1">
                            {count.availableInMarketplaces.map(
                              (marketplace, index) => (
                                <span
                                  key={index}
                                  className={`py-0.5 px-2 rounded-full text-white text-xs ${
                                    marketplace.toLowerCase() === "opensea"
                                      ? "bg-[#2081e280]"
                                      : marketplace.toLowerCase() === "blur"
                                      ? "bg-[#FF870080]"
                                      : marketplace.toLowerCase() ===
                                        "magiceden"
                                      ? "bg-[#e4257580]"
                                      : ""
                                  }`}
                                >
                                  {marketplace}{" "}
                                  {marketplace.toLowerCase() === "opensea" &&
                                  count.openseaFloor
                                    ? `${count.openseaFloor.toFixed(4)} ETH`
                                    : marketplace.toLowerCase() === "blur" &&
                                      count.blurFloor
                                    ? `${count.blurFloor.toFixed(4)} ETH`
                                    : marketplace.toLowerCase() ===
                                        "magiceden" && count.magicedenFloor
                                    ? `${count.magicedenFloor.toFixed(4)} ETH`
                                    : ""}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                        <span>{count.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TraitSelector;
