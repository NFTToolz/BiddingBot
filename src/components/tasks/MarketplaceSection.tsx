import { TaskFormState } from "@/hooks/useTaskForm";
import React from "react";

const MarketplaceSection = ({
  formState,
  errors,
  handleMarketplaceToggle,
}: IMarketplaceSection) => {
  return (
    <div>
      <label htmlFor="marketplaces" className="block text-sm font-medium mb-2">
        Select Marketplace <span className="text-red-500">*</span>
      </label>
      <div className="flex flex-wrap gap-4">
        {["OpenSea", "Blur", "MagicEden"]
          .filter(
            (marketplace) =>
              !(marketplace === "Blur" && formState.bidType === "token")
          )
          .map((marketplace) => {
            const isActive =
              formState.selectedMarketplaces.includes(marketplace);
            const activeColor =
              marketplace === "MagicEden"
                ? "bg-[#e42575]"
                : marketplace === "Blur"
                ? "bg-[#FF8700]"
                : "bg-[#2081e2]";
            const isDisabled =
              (marketplace === "MagicEden" && !formState.magicEdenValid) ||
              (marketplace === "Blur" && !formState.blurValid) ||
              (marketplace === "OpenSea" && !formState.openseaValid) ||
              (marketplace === "Blur" && formState.bidType === "token");
            return (
              <div className="flex flex-col" key={marketplace}>
                <button
                  type="button"
                  onClick={() => handleMarketplaceToggle(marketplace)}
                  className="flex items-center"
                  disabled={isDisabled}
                >
                  <span className="mr-2 text-sm">{marketplace}</span>
                  <div className="w-10 h-6 flex items-center rounded-full p-1 bg-gray-300">
                    <div
                      className={`w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out
                        ${
                          isActive
                            ? `translate-x-4 ${activeColor}`
                            : "translate-x-0 bg-white"
                        }`}
                    ></div>
                  </div>
                </button>
                <p className="text-xs mt-0.5 text-[#9691A4]">
                  {(() => {
                    const price =
                      marketplace.toLowerCase() === "opensea" &&
                      Number(formState.openseaFloorPrice) > 0
                        ? formState.openseaFloorPrice?.toFixed(4)
                        : marketplace.toLowerCase() === "blur" &&
                          Number(formState.blurFloorPrice) > 0
                        ? formState.blurFloorPrice?.toFixed(4)
                        : marketplace.toLowerCase() === "magiceden" &&
                          Number(formState.magicedenFloorPrice) > 0
                        ? formState.magicedenFloorPrice?.toFixed(4)
                        : null;

                    return price ? `${price} ETH` : null;
                  })()}
                </p>
              </div>
            );
          })}
      </div>
      {formState.validationComplete &&
      formState.slugValid &&
      !formState.blurValid ? (
        <p className="text-red-500 text-sm mt-1">
          ⚠️ this collection is not available on Blur Marketplace
        </p>
      ) : null}
      {formState.validationComplete &&
      formState.slugValid &&
      !formState.openseaValid ? (
        <p className="text-red-500 text-sm mt-1">
          ⚠️ this collection is not available on OpenSea Marketplace
        </p>
      ) : null}
      {formState.validationComplete &&
      formState.slugValid &&
      !formState.magicEdenValid ? (
        <p className="text-red-500 text-sm mt-1">
          ⚠️ this collection is not available on Magic Eden Marketplace
        </p>
      ) : null}

      {errors.selectedMarketplaces && (
        <p className="text-red-500 text-sm mt-1">
          {errors.selectedMarketplaces}
        </p>
      )}
    </div>
  );
};

export default MarketplaceSection;

interface IMarketplaceSection {
  formState: TaskFormState;
  errors: Partial<TaskFormState>;
  handleMarketplaceToggle: (marketplace: string) => void;
}
