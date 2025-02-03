import React, { useState, useEffect, useCallback } from "react";
import { TaskFormState } from "@/hooks/useTaskForm";
import CustomSelect, { CustomSelectOption } from "../common/CustomSelect";
import Toggle from "../common/Toggle";
import TraitSelector from "./TraitSelector";
import MarketplaceSection from "./MarketplaceSection";
import LoadingIcon from "@/assets/svg/LoadingIcon";
import { useTaskStore } from "@/store/task.store";

interface FormSectionProps {
  formState: TaskFormState;
  errors: Partial<TaskFormState>;
  walletOptions: CustomSelectOption[];
  setFormState: React.Dispatch<React.SetStateAction<TaskFormState>>;
  onWalletModalOpen: () => void;
  handleTraitChange: (
    traits: Record<
      string,
      { name: string; availableInMarketplaces: string[] }[]
    >
  ) => void;
  handleMarketplaceToggle: (marketplace: string) => void;
  tokenIdInput: string;
  setTokenIdInput: React.Dispatch<React.SetStateAction<string>>;
  isFetchingTokens: boolean;
  taskId: string;
}

const FormSection: React.FC<FormSectionProps> = ({
  formState,
  errors,
  walletOptions,
  setFormState,
  onWalletModalOpen,
  handleTraitChange,
  handleMarketplaceToggle,
  tokenIdInput,
  setTokenIdInput,
  isFetchingTokens,
  taskId,
}) => {
  const GENERAL_BID_PRICE = "GENERAL_BID_PRICE";
  const MARKETPLACE_BID_PRICE = "MARKETPLACE_BID_PRICE";

  const priceTypeOptions: CustomSelectOption[] = [
    { value: "percentage", label: "%" },
    { value: "eth", label: "ETH" },
  ];

  const durationTypeOptions: CustomSelectOption[] = [
    { value: "minutes", label: "Min" },
    { value: "hours", label: "Hours" },
    { value: "days", label: "Days" },
  ];

  const [tokenIdError, setTokenIdError] = useState<string | null>(null);

  const validateTokenIds = (value: string): boolean => {
    const ranges = value.split(",").map((range) => range.trim());

    return ranges.every((range) => {
      if (/^bot\d+$/.test(range)) {
        return true;
      } else if (/^\d+$/.test(range)) {
        return true;
      } else if (/^\d+\s*-\s*\d+$/.test(range)) {
        const [start, end] = range
          .split("-")
          .map((num) => parseInt(num.trim()));
        return (
          !isNaN(start) &&
          !isNaN(end) &&
          start <= end &&
          Number.isInteger(start) &&
          Number.isInteger(end)
        );
      }
      return false;
    });
  };

  const handleTokenIdsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setTokenIdInput(value);

    if (value.trim() === "") {
      setTokenIdError(null);
      setFormState((prev) => ({
        ...prev,
        tokenIds: [],
      }));
      return;
    }

    const isValid = validateTokenIds(value);
    setTokenIdError(
      isValid
        ? null
        : "Invalid input. Please use numbers, ranges (e.g., 1-5), or number of bottom listed (e.g., bot10)."
    );

    // If input is valid, update formState's tokenIds
    if (isValid) {
      const processedIds = processTokenIds(value);
      setFormState((prev) => ({
        ...prev,
        tokenIds: processedIds,
      }));
    }
  };

  const processTokenIds = (input: string): (number | string)[] => {
    const ranges = input.split(",").map((range) => range.trim());
    const tokenIds: (number | string)[] = [];

    ranges.forEach((range) => {
      if (/^bot\d+$/.test(range)) {
        tokenIds.push(range);
      } else if (/^\d+$/.test(range)) {
        tokenIds.push(parseInt(range));
      } else if (/^\d+\s*-\s*\d+$/.test(range)) {
        const [start, end] = range
          .split("-")
          .map((num) => parseInt(num.trim()));
        for (let i = start; i <= end; i++) {
          tokenIds.push(i);
        }
      }
    });

    return Array.from(new Set(tokenIds));
  };

  const updateOutbidOptions = (
    updatedOptions: Partial<typeof formState.outbidOptions>
  ) => {
    setFormState((prev) => {
      const newOutbidOptions = {
        ...prev.outbidOptions,
        ...updatedOptions,
      };

      if (!newOutbidOptions.outbid) {
        newOutbidOptions.counterbid = false;
      }

      if (!newOutbidOptions.outbid && !newOutbidOptions.counterbid) {
        newOutbidOptions.blurOutbidMargin = null;
        newOutbidOptions.openseaOutbidMargin = null;
        newOutbidOptions.magicedenOutbidMargin = null;
      }

      return {
        ...prev,
        outbidOptions: newOutbidOptions,
      };
    });
  };

  const handlePriceTypeChange = (selectedValue: string, priceType: string) => {
    setFormState((prev) => ({
      ...prev,
      [priceType]: {
        //@ts-ignore
        ...prev[priceType],
        minType: selectedValue as "percentage" | "eth",
        maxType: selectedValue as "percentage" | "eth",
      },
    }));
  };

  const getDecimalPrecision = (value: number) => {
    if (value < 0.1) return 4;
    if (value < 1) return 3;
    return 2;
  };

  const formatToValidPrecision = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    const precision = getDecimalPrecision(numValue);
    return numValue.toFixed(precision);
  };

  const handleBidPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const priceType = name.split(".")[1];
    const priceCategory = name.split(".")[0];

    // Validate input format
    if (value !== "" && !/^\d*\.?\d{0,4}$/.test(value)) {
      return;
    }

    setFormState((prev) => ({
      ...prev,
      [priceCategory]: {
        // @ts-ignore
        ...prev[priceCategory],
        [priceType]: value,
      },
    }));
  };

  const handleBidPriceBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const priceType = name.split(".")[1];
    const priceCategory = name.split(".")[0];

    // Only format if it's ETH type and has a value
    if (
      ((priceCategory === "bidPrice" && formState.bidPrice.minType === "eth") ||
        (priceCategory === "openseaBidPrice" &&
          formState.openseaBidPrice.minType === "eth")) &&
      value !== ""
    ) {
      let numValue = parseFloat(value);

      // Enforce minimum value
      if (numValue < 0.0001) {
        numValue = 0.0001;
      }

      // Enforce maximum value
      if (numValue > 1000000) {
        numValue = 1000000;
      }

      const formattedValue = formatToValidPrecision(String(numValue));
      setFormState((prev) => ({
        ...prev,
        [priceCategory]: {
          // @ts-ignore
          ...prev[priceCategory],
          [priceType]: formattedValue,
        },
      }));
    }
  };

  const handleBidDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      bidDuration: {
        ...prev.bidDuration,
        [name]: value,
      },
    }));
  };

  const handleLoopIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      loopInterval: {
        ...prev.loopInterval,
        [name]: value,
      },
    }));
  };

  const handleBidTypeChange = (type: string) => {
    setFormState((prev) => ({
      ...prev,
      bidType: type,
    }));
  };

  const handleTraitSelect = (
    traits: Record<
      string,
      { name: string; availableInMarketplaces: string[] }[]
    >
  ) => {
    handleTraitChange(traits);
    useTaskStore
      .getState()
      .editTask(taskId as string, { selectedTraits: traits });
  };

  const handleBidPriceTypeChange = (type: string) => {
    setFormState((prev) => ({
      ...prev,
      bidPriceType: type,
    }));
  };

  const floorPrices = [
    Number(formState.openseaFloorPrice),
    Number(formState.blurFloorPrice),
    Number(formState.magicedenFloorPrice),
  ].filter((price) => Number(price) > 0);

  const minFloorPrice = Math.min(...floorPrices);

  return (
    <>
      {/* <CustomSelect
				showDeleteWallet={true}
				options={walletOptions}
				value={formState.wallet?.address || ""}
				onChange={(selectedValue) =>
					setFormState((prev) => ({
						...prev,
						wallet: {
							...prev.wallet,
							address: selectedValue,
						},
					}))
				}
				placeholder='Select a wallet'
			/> */}
      <MarketplaceSection
        formState={formState}
        errors={errors}
        handleMarketplaceToggle={handleMarketplaceToggle}
      />
      <div>
        <label
          htmlFor="walletSelection"
          className="block text-sm font-medium mb-2"
        >
          Select Wallet <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <CustomSelect
            showDeleteWallet={true}
            options={walletOptions}
            value={formState.wallet?.address || ""}
            onChange={(selectedValue) =>
              setFormState((prev) => ({
                ...prev,
                wallet: {
                  ...prev.wallet,
                  address: selectedValue,
                },
              }))
            }
            placeholder="Select a wallet"
          />
          <button
            onClick={onWalletModalOpen}
            className="text-sm text-Brand/Brand-1 mt-0.5 ml-2 block italic"
          >
            create wallet
          </button>
        </div>
        {errors.wallet?.address && (
          <p className="text-red-500 text-sm mt-1">{errors.wallet.address}</p>
        )}
      </div>

      <div>
        <label htmlFor="bidType" className="block text-sm font-medium mb-2">
          Bid Type
        </label>
        <div className="flex gap-8">
          <label className="inline-flex items-center cursor-pointer gap-2">
            <input
              type="radio"
              name="bidType"
              checked={formState.bidType === "collection"}
              onChange={() => handleBidTypeChange("collection")}
              className="hidden"
            />
            <span className="relative w-6 h-6 inline-block">
              <span
                className={`absolute inset-0 rounded-full border-2 ${
                  formState.bidType === "collection"
                    ? "border-[#7364DB]"
                    : "border-gray-400"
                }`}
              ></span>
              {formState.bidType === "collection" && (
                <span className="absolute inset-1.5 rounded-full bg-[#7364DB]"></span>
              )}
            </span>
            <p className="text-sm">Collection Offers</p>
          </label>

          <label className="inline-flex items-center cursor-pointer gap-2">
            <input
              type="radio"
              name="bidType"
              checked={formState.bidType === "token"}
              onChange={() => handleBidTypeChange("token")}
              className="hidden"
            />
            <span className="relative w-6 h-6 inline-block">
              <span
                className={`absolute inset-0 rounded-full border-2 ${
                  formState.bidType === "token"
                    ? "border-[#7364DB]"
                    : "border-gray-400"
                }`}
              ></span>
              {formState.bidType === "token" && (
                <span className="absolute inset-1.5 rounded-full bg-[#7364DB]"></span>
              )}
            </span>
            <p className="text-sm">Token Offers</p>
          </label>
        </div>
      </div>

      {formState.bidType === "token" && (
        <div>
          <label htmlFor="tokenIds" className="block text-sm font-medium mb-2">
            Token Range
          </label>
          <div className="flex items-center">
            <input
              type="text"
              id="tokenIds"
              name="tokenIds"
              value={tokenIdInput}
              onChange={handleTokenIdsChange}
              placeholder="1-5, 7, bot10, 15-20"
              className={`w-full p-3 border rounded-lg bg-Neutral/Neutral-300-[night] focus:border-none active:border-none focus-visible:border-none ${
                tokenIdError ? "border-red-500" : "border-Neutral-BG-[night]"
              }`}
              autoComplete="off"
              disabled={isFetchingTokens}
            />
            {isFetchingTokens && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg">
                <div className="flex items-center space-x-2">
                  <LoadingIcon width={72} height={72} />
                </div>
              </div>
            )}
          </div>
          {tokenIdError && (
            <p className="text-red-500 text-xs mt-1">{tokenIdError}</p>
          )}
        </div>
      )}

      {formState.traits?.categories &&
        Object.keys(formState.traits.categories).length > 0 && (
          <div className="col-span-2 mt-6">
            <h3 className="mb-2 font-medium">Select Traits</h3>
            <TraitSelector
              traits={formState.traits}
              onTraitSelect={handleTraitSelect}
              initialSelectedTraits={formState.selectedTraits}
            />
          </div>
        )}

      <div className="flex items-center mb-2 gap-2 mt-4">
        <Toggle
          checked={formState.bidPriceType === MARKETPLACE_BID_PRICE}
          onChange={() =>
            handleBidPriceTypeChange(
              formState.bidPriceType === MARKETPLACE_BID_PRICE
                ? GENERAL_BID_PRICE
                : MARKETPLACE_BID_PRICE
            )
          }
        />
        <span
          className="text-sm cursor-pointer"
          onClick={() => {
            handleBidPriceTypeChange(
              formState.bidPriceType === MARKETPLACE_BID_PRICE
                ? GENERAL_BID_PRICE
                : MARKETPLACE_BID_PRICE
            );
          }}
        >
          Marketplace Specific Bid Amount
        </span>
      </div>
      <div className="flex items-center mb-2 gap-2 mt-4">
        <Toggle
          checked={formState.outbidOptions.outbid}
          onChange={() =>
            updateOutbidOptions({ outbid: !formState.outbidOptions.outbid })
          }
        />
        <span
          className="text-sm cursor-pointer"
          onClick={() =>
            updateOutbidOptions({
              outbid: !formState.outbidOptions.outbid,
            })
          }
        >
          {formState.outbidOptions.outbid
            ? "Disable Outbidding"
            : "Enable Outbidding"}
        </span>
      </div>

      {formState.bidPriceType === GENERAL_BID_PRICE ? (
        <div>
          <label htmlFor="minPrice" className="block text-sm font-medium mb-2">
            {formState.outbidOptions.outbid ||
            formState.outbidOptions.counterbid
              ? "Min Bid Price "
              : "Bid Price"}

            <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center">
            <input
              min={0.0001}
              max={1000000}
              step={0.0001}
              inputMode="numeric"
              type="number"
              id="minPrice"
              name={"bidPrice.min"}
              onChange={handleBidPriceChange}
              onBlur={handleBidPriceBlur}
              value={formState.bidPrice.min}
              placeholder={
                formState.bidPrice.minType === "percentage" ? "10" : "0.1"
              }
              className={`w-full p-3 rounded-l-lg border border-r-0 border-Neutral-BG-[night] bg-Neutral/Neutral-300-[night]`}
              required
              autoComplete="off"
            />
            <CustomSelect
              options={priceTypeOptions}
              value={formState.bidPrice.minType}
              onChange={(value) => handlePriceTypeChange(value, "bidPrice")}
              className="w-20 ml-2"
            />
          </div>

          {formState.bidPrice.minType === "percentage" && minFloorPrice && (
            <span className="text-xs text-n-3">
              {((minFloorPrice * +formState.bidPrice.min) / 100).toFixed(4)} ETH
            </span>
          )}
          {errors.bidPrice?.min && (
            <p className="text-red-500 text-sm mt-1">{errors.bidPrice.min}</p>
          )}
        </div>
      ) : (
        <div></div>
      )}

      {formState.outbidOptions.outbid &&
      formState.bidPriceType === GENERAL_BID_PRICE ? (
        <div>
          <label htmlFor="maxPrice" className="block text-sm font-medium mb-2">
            Max Bid Price
            <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center">
            <input
              min={0.0001}
              max={1000000}
              step={0.0001}
              inputMode="numeric"
              type="number"
              id="maxPrice"
              name={"bidPrice.max"}
              onChange={handleBidPriceChange}
              onBlur={handleBidPriceBlur}
              value={formState.bidPrice.max}
              placeholder={
                formState.bidPrice.maxType === "percentage" ? "80" : "1"
              }
              className={`w-full p-3 rounded-l-lg border border-r-0 border-Neutral-BG-[night] bg-Neutral/Neutral-300-[night]`}
              autoComplete="off"
            />
            <CustomSelect
              options={priceTypeOptions}
              value={formState.bidPrice.maxType}
              onChange={(value) => handlePriceTypeChange(value, "bidPrice")}
              className="w-20 ml-2"
            />
          </div>
          {formState.bidPrice.maxType === "percentage" && minFloorPrice && (
            <span className="text-xs text-n-3">
              {((minFloorPrice * +formState.bidPrice.max) / 100).toFixed(4)} ETH
            </span>
          )}
          {errors.bidPrice?.max && (
            <p className="text-red-500 text-sm mt-1">{errors.bidPrice.max}</p>
          )}
        </div>
      ) : (
        <div></div>
      )}

      {formState.bidPriceType === MARKETPLACE_BID_PRICE &&
      formState.selectedMarketplaces
        .map((m) => m.toLowerCase())
        .includes("opensea") ? (
        <div>
          <label htmlFor="maxPrice" className="block text-sm font-medium mb-2">
            {formState.outbidOptions.outbid
              ? "Opensea Min Bid Price"
              : "Opensea Bid Price"}
          </label>
          <div className="flex items-center">
            <input
              inputMode="numeric"
              step={
                formState.openseaBidPrice.minType === "percentage"
                  ? 0.1
                  : 0.0001
              }
              min={
                formState.openseaBidPrice.minType === "percentage" ? 1 : 0.005
              }
              type="number"
              id="openseaMinPrice"
              name={"openseaBidPrice.min"}
              onChange={handleBidPriceChange}
              onBlur={handleBidPriceBlur}
              value={formState.openseaBidPrice.min}
              placeholder={
                formState.openseaBidPrice.minType === "percentage" ? "80" : "1"
              }
              className={`w-full p-3 rounded-l-lg border border-r-0 border-Neutral-BG-[night] bg-Neutral/Neutral-300-[night]`}
              autoComplete="off"
              required={
                formState.selectedMarketplaces
                  .map((m) => m.toLowerCase())
                  .includes("opensea") &&
                formState.bidPriceType === MARKETPLACE_BID_PRICE
              }
            />
            <CustomSelect
              options={priceTypeOptions}
              value={formState.openseaBidPrice.minType}
              onChange={(value) =>
                handlePriceTypeChange(value, "openseaBidPrice")
              }
              className="w-20 ml-2"
            />
          </div>
          {formState.openseaBidPrice.minType === "percentage" &&
            formState.openseaFloorPrice && (
              <span className="text-xs text-n-3">
                {(
                  (formState.openseaFloorPrice *
                    +formState.openseaBidPrice.min) /
                  100
                ).toFixed(4)}{" "}
                ETH
              </span>
            )}

          {errors.openseaBidPrice?.min && (
            <p className="text-red-500 text-sm mt-1">
              {errors.openseaBidPrice.min}
            </p>
          )}
        </div>
      ) : (
        <div></div>
      )}

      {formState.bidPriceType === MARKETPLACE_BID_PRICE &&
      formState.outbidOptions.outbid &&
      formState.selectedMarketplaces
        .map((m) => m.toLowerCase())
        .includes("opensea") ? (
        <div>
          <label htmlFor="maxPrice" className="block text-sm font-medium mb-2">
            Opensea Max Bid Price
          </label>
          <div className="flex items-center">
            <input
              step={
                formState.openseaBidPrice.maxType === "percentage"
                  ? 0.1
                  : 0.0001
              }
              min={
                formState.openseaBidPrice.maxType === "percentage" ? 1 : 0.005
              }
              inputMode="numeric"
              type="number"
              id="openseaMaxPrice"
              name={"openseaBidPrice.max"}
              onChange={handleBidPriceChange}
              onBlur={handleBidPriceBlur}
              value={formState.openseaBidPrice.max}
              placeholder={
                formState.openseaBidPrice.maxType === "percentage" ? "80" : "1"
              }
              className={`w-full p-3 rounded-l-lg border border-r-0 border-Neutral-BG-[night] bg-Neutral/Neutral-300-[night]`}
              autoComplete="off"
              required={
                formState.selectedMarketplaces
                  .map((m) => m.toLowerCase())
                  .includes("opensea") &&
                formState.bidPriceType === MARKETPLACE_BID_PRICE &&
                formState.outbidOptions.outbid
              }
            />
            <CustomSelect
              options={priceTypeOptions}
              value={formState.openseaBidPrice.maxType}
              onChange={(value) =>
                handlePriceTypeChange(value, "openseaBidPrice")
              }
              className="w-20 ml-2"
            />
          </div>
          {formState.openseaBidPrice.maxType === "percentage" &&
            formState.openseaFloorPrice && (
              <span className="text-xs text-n-3">
                {(
                  (formState.openseaFloorPrice *
                    +formState.openseaBidPrice.max) /
                  100
                ).toFixed(4)}{" "}
                ETH
              </span>
            )}
          {errors.openseaBidPrice?.max && (
            <p className="text-red-500 text-sm mt-1">
              {errors.openseaBidPrice.max}
            </p>
          )}
        </div>
      ) : (
        <div></div>
      )}

      {formState.bidPriceType === MARKETPLACE_BID_PRICE &&
      formState.selectedMarketplaces
        .map((m) => m.toLowerCase())
        .includes("blur") ? (
        <div>
          <label htmlFor="maxPrice" className="block text-sm font-medium mb-2">
            {formState.outbidOptions.outbid
              ? "Blur Min Bid Price"
              : "Blur Bid Price"}
          </label>
          <div className="flex items-center">
            <input
              inputMode="numeric"
              step={
                formState.blurBidPrice.minType === "percentage" ? 0.1 : 0.01
              }
              min={formState.blurBidPrice.minType === "percentage" ? 1 : 0.01}
              type="number"
              id="blurMinPrice"
              name={"blurBidPrice.min"}
              onChange={handleBidPriceChange}
              onBlur={handleBidPriceBlur}
              value={formState.blurBidPrice.min}
              placeholder={
                formState.blurBidPrice.minType === "percentage" ? "80" : "1"
              }
              className={`w-full p-3 rounded-l-lg border border-r-0 border-Neutral-BG-[night] bg-Neutral/Neutral-300-[night]`}
              autoComplete="off"
              required={
                formState.selectedMarketplaces
                  .map((m) => m.toLowerCase())
                  .includes("blur") &&
                formState.bidPriceType === MARKETPLACE_BID_PRICE
              }
            />
            <CustomSelect
              options={priceTypeOptions}
              value={formState.blurBidPrice.minType}
              onChange={(value) => handlePriceTypeChange(value, "blurBidPrice")}
              className="w-20 ml-2"
            />
          </div>

          {formState.blurBidPrice.minType === "percentage" &&
            formState.blurFloorPrice && (
              <span className="text-xs text-n-3">
                {(
                  (Number(formState.blurFloorPrice) *
                    +formState.blurBidPrice.min) /
                  100
                ).toFixed(2)}{" "}
                ETH
              </span>
            )}
          {errors.blurBidPrice?.max && (
            <p className="text-red-500 text-sm mt-1">
              {errors.blurBidPrice.max}
            </p>
          )}
        </div>
      ) : (
        <div></div>
      )}

      {formState.bidPriceType === MARKETPLACE_BID_PRICE &&
      formState.outbidOptions.outbid &&
      formState.selectedMarketplaces
        .map((m) => m.toLowerCase())
        .includes("blur") ? (
        <div>
          <label htmlFor="maxPrice" className="block text-sm font-medium mb-2">
            Blur Max Bid Price
          </label>
          <div className="flex items-center">
            <input
              step={
                formState.blurBidPrice.maxType === "percentage" ? 0.1 : 0.01
              }
              min={formState.blurBidPrice.maxType === "percentage" ? 1 : 0.01}
              inputMode="numeric"
              type="number"
              id="blurMaxPrice"
              name={"blurBidPrice.max"}
              onChange={handleBidPriceChange}
              onBlur={handleBidPriceBlur}
              value={formState.blurBidPrice.max}
              placeholder={
                formState.blurBidPrice.maxType === "percentage" ? "80" : "1"
              }
              className={`w-full p-3 rounded-l-lg border border-r-0 border-Neutral-BG-[night] bg-Neutral/Neutral-300-[night]`}
              autoComplete="off"
              required={
                formState.selectedMarketplaces
                  .map((m) => m.toLowerCase())
                  .includes("blur") &&
                formState.bidPriceType === MARKETPLACE_BID_PRICE &&
                formState.outbidOptions.outbid
              }
            />
            <CustomSelect
              options={priceTypeOptions}
              value={formState.blurBidPrice.maxType}
              onChange={(value) => handlePriceTypeChange(value, "blurBidPrice")}
              className="w-20 ml-2"
            />
          </div>
          {formState.blurBidPrice.maxType === "percentage" &&
            formState.blurFloorPrice && (
              <span className="text-xs text-n-3">
                {(
                  (formState.blurFloorPrice * +formState.blurBidPrice.max) /
                  100
                ).toFixed(2)}{" "}
                ETH
              </span>
            )}
          {errors.blurBidPrice?.max && (
            <p className="text-red-500 text-sm mt-1">
              {errors.blurBidPrice.max}
            </p>
          )}
        </div>
      ) : (
        <div></div>
      )}

      {formState.bidPriceType === MARKETPLACE_BID_PRICE &&
      formState.selectedMarketplaces
        .map((m) => m.toLowerCase())
        .includes("magiceden") ? (
        <div>
          <label
            htmlFor="magicEdenMinPrice"
            className="block text-sm font-medium mb-2"
          >
            {formState.outbidOptions.outbid
              ? "MagicEden Min Bid Price"
              : "MagicEden Bid Price"}
          </label>
          <div className="flex items-center">
            <input
              step={
                formState.magicEdenBidPrice.minType === "percentage"
                  ? 0.1
                  : 0.0001
              }
              min={
                formState.magicEdenBidPrice.minType === "percentage" ? 1 : 0.005
              }
              inputMode="numeric"
              type="number"
              id="magicEdenMinPrice"
              name={"magicEdenBidPrice.min"}
              onChange={handleBidPriceChange}
              onBlur={handleBidPriceBlur}
              value={formState.magicEdenBidPrice.min}
              placeholder={
                formState.magicEdenBidPrice.minType === "percentage"
                  ? "80"
                  : "1"
              }
              className={`w-full p-3 rounded-l-lg border border-r-0 border-Neutral-BG-[night] bg-Neutral/Neutral-300-[night]`}
              autoComplete="off"
              required={
                formState.selectedMarketplaces
                  .map((m) => m.toLowerCase())
                  .includes("magiceden") &&
                formState.bidPriceType === MARKETPLACE_BID_PRICE
              }
            />
            <CustomSelect
              options={priceTypeOptions}
              value={formState.magicEdenBidPrice.minType}
              onChange={(value) =>
                handlePriceTypeChange(value, "magicEdenBidPrice")
              }
              className="w-20 ml-2"
            />
          </div>
          {formState.magicEdenBidPrice.minType === "percentage" &&
            formState.magicedenFloorPrice && (
              <span className="text-xs text-n-3">
                {(
                  (formState.magicedenFloorPrice *
                    +formState.magicEdenBidPrice.min) /
                  100
                ).toFixed(4)}{" "}
                ETH
              </span>
            )}{" "}
          {errors.magicEdenBidPrice?.min && (
            <p className="text-red-500 text-sm mt-1">
              {errors.magicEdenBidPrice.min}
            </p>
          )}
        </div>
      ) : (
        <div></div>
      )}

      {formState.bidPriceType === MARKETPLACE_BID_PRICE &&
      formState.outbidOptions.outbid &&
      formState.selectedMarketplaces
        .map((m) => m.toLowerCase())
        .includes("magiceden") ? (
        <div>
          <label
            htmlFor="magicEdenMaxPrice"
            className="block text-sm font-medium mb-2"
          >
            MagicEden Max Bid Price
          </label>
          <div className="flex items-center">
            <input
              step={
                formState.magicEdenBidPrice.maxType === "percentage"
                  ? 0.1
                  : 0.0001
              }
              min={
                formState.magicEdenBidPrice.maxType === "percentage" ? 1 : 0.005
              }
              inputMode="numeric"
              type="number"
              id="magicEdenMaxPrice"
              name={"magicEdenBidPrice.max"}
              onChange={handleBidPriceChange}
              onBlur={handleBidPriceBlur}
              value={formState.magicEdenBidPrice.max}
              placeholder={
                formState.magicEdenBidPrice.maxType === "percentage"
                  ? "80"
                  : "1"
              }
              className={`w-full p-3 rounded-l-lg border border-r-0 border-Neutral-BG-[night] bg-Neutral/Neutral-300-[night]`}
              autoComplete="off"
              required={
                formState.selectedMarketplaces
                  .map((m) => m.toLowerCase())
                  .includes("magiceden") &&
                formState.bidPriceType === MARKETPLACE_BID_PRICE &&
                formState.outbidOptions.outbid
              }
            />
            <CustomSelect
              options={priceTypeOptions}
              value={formState.magicEdenBidPrice.maxType}
              onChange={(value) =>
                handlePriceTypeChange(value, "magicEdenBidPrice")
              }
              className="w-20 ml-2"
            />
          </div>
          {formState.magicEdenBidPrice.maxType === "percentage" &&
            formState.magicedenFloorPrice && (
              <span className="text-xs text-n-3">
                {(
                  (formState.magicedenFloorPrice *
                    +formState.magicEdenBidPrice.max) /
                  100
                ).toFixed(4)}{" "}
                ETH
              </span>
            )}{" "}
          {errors.magicEdenBidPrice?.max && (
            <p className="text-red-500 text-sm mt-1">
              {errors.magicEdenBidPrice.max}
            </p>
          )}
        </div>
      ) : (
        <div></div>
      )}

      <div>
        <label htmlFor="bidDuration" className="block text-sm font-medium mb-2">
          Bid Duration
        </label>
        <div className="flex items-center">
          <input
            inputMode="numeric"
            type="number"
            id="bidDuration"
            name="value"
            min={formState.bidDuration.unit === "minutes" ? 15 : 1}
            onChange={handleBidDurationChange}
            value={formState.bidDuration.value || 15}
            placeholder="Duration"
            className="w-full p-3 rounded-l-lg border border-r-0 border-Neutral-BG-[night] bg-Neutral/Neutral-300-[night]"
            autoComplete="off"
          />
          <CustomSelect
            options={durationTypeOptions}
            value={formState.bidDuration.unit || "minutes"}
            onChange={(value) =>
              handleBidDurationChange({
                target: { name: "unit", value },
              } as React.ChangeEvent<HTMLInputElement>)
            }
            className="w-20 ml-2"
          />
        </div>
        {errors.bidDuration?.value && (
          <p className="text-red-500 text-sm mt-1">
            {errors.bidDuration.value}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="bidDuration" className="block text-sm font-medium mb-2">
          Loop Interval
        </label>
        <div className="flex items-center">
          <input
            inputMode="numeric"
            type="number"
            id="loopInterval"
            name="value"
            step={1}
            min={0}
            onChange={handleLoopIntervalChange}
            value={formState.loopInterval.value}
            placeholder="15 Minutes"
            className="w-full p-3 rounded-l-lg border border-r-0 border-Neutral-BG-[night] bg-Neutral/Neutral-300-[night]"
            autoComplete="off"
          />
          <CustomSelect
            options={durationTypeOptions}
            value={formState.loopInterval.unit || "minutes"}
            onChange={(value) =>
              handleLoopIntervalChange({
                target: { name: "unit", value },
              } as React.ChangeEvent<HTMLInputElement>)
            }
            className="w-20 ml-2"
          />
        </div>
      </div>
    </>
  );
};

export default FormSection;
