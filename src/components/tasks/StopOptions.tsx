import React from "react";
import "./task.css";
import { TaskFormState } from "@/hooks/useTaskForm";
import Toggle from "../common/Toggle";

const StopOption = ({ formState, setFormState }: IStopOption) => {
  const openseaFloorPrice = Number(formState.openseaFloorPrice);
  const blurFloorPrice = Number(formState.blurFloorPrice);
  const magicedenFloorPrice = Number(formState.magicedenFloorPrice);

  const balance = Number(formState.balance);

  const validPrices = [
    openseaFloorPrice,
    blurFloorPrice,
    magicedenFloorPrice,
  ].filter((price) => price > 0);

  const floorPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;

  const updateStopOptions = (
    updatedOptions: Partial<typeof formState.stopOptions>
  ) => {
    setFormState((prev) => {
      let newStopOptions = {
        ...prev.stopOptions,
        ...updatedOptions,
      };

      if (!newStopOptions.triggerStopOptions) {
        newStopOptions.cancelAllBids = false;
        newStopOptions.pauseAllBids = false;
        newStopOptions.stopAllBids = false;
        newStopOptions.minFloorPrice = null;
        newStopOptions.maxFloorPrice = null;
        newStopOptions.minTraitPrice = null;
        newStopOptions.maxTraitPrice = null;
        newStopOptions.maxPurchase = null;
      }

      if (newStopOptions.pauseAllBids) {
        newStopOptions.stopAllBids = false;
      }
      if (newStopOptions.stopAllBids) {
        newStopOptions.pauseAllBids = false;
      }

      return {
        ...prev,
        stopOptions: newStopOptions,
      };
    });
  };

  return (
    <>
      <div className="mt-6">
        <h2 className="font-medium mb-4">Stop Option</h2>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-4">
            <Toggle
              checked={formState.stopOptions.triggerStopOptions}
              onChange={() =>
                updateStopOptions({
                  triggerStopOptions: !formState.stopOptions.triggerStopOptions,
                })
              }
            />

            <span
              className="text-sm cursor-pointer"
              onClick={() =>
                updateStopOptions({
                  triggerStopOptions: !formState.stopOptions.triggerStopOptions,
                })
              }
            >
              {formState.stopOptions.triggerStopOptions
                ? "Disable Smart Stop"
                : "Enable Smart Stop"}
            </span>
          </div>
        </div>
      </div>
      {formState.stopOptions.triggerStopOptions ? (
        <div className="mt-6">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="minFloorPrice" className="block text-sm mb-1">
                  Min Floor Price
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col gap-2">
                  <input
                    inputMode="numeric"
                    type="number"
                    id="minFloorPrice"
                    step={0.0001}
                    min={0.0001}
                    name="minFloorPrice"
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        stopOptions: {
                          ...prev.stopOptions,
                          minFloorPrice: e.target.value,
                        },
                      }))
                    }
                    value={formState.stopOptions.minFloorPrice?.toString()}
                    placeholder="0.0001"
                    className="w-full p-3 rounded-lg border border-Neutral-BG-[night] bg-Neutral/Neutral-300-[night]"
                    required={formState.stopOptions.triggerStopOptions}
                    autoComplete="off"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormState((prev) => ({
                          ...prev,
                          stopOptions: {
                            ...prev.stopOptions,
                            minFloorPrice: Math.max(
                              0.0001,
                              floorPrice * 0.75
                            ).toFixed(4),
                          },
                        }));
                      }}
                      className="flex-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-Brand/Brand-1 transition-colors"
                    >
                      -25%
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormState((prev) => ({
                          ...prev,
                          stopOptions: {
                            ...prev.stopOptions,
                            minFloorPrice: Math.max(
                              0.0001,
                              floorPrice * 0.9
                            ).toFixed(4),
                          },
                        }));
                      }}
                      className="flex-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-Brand/Brand-1 transition-colors"
                    >
                      -10%
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="maxFloorPrice" className="block text-sm mb-1">
                  Max Floor Price
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col gap-2">
                  <input
                    inputMode="numeric"
                    type="number"
                    id="maxFloorPrice"
                    step={0.0001}
                    name="maxFloorPrice"
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        stopOptions: {
                          ...prev.stopOptions,
                          maxFloorPrice: e.target.value,
                        },
                      }))
                    }
                    value={formState.stopOptions.maxFloorPrice?.toString()}
                    placeholder="0.0001"
                    className="w-full p-3 rounded-lg border border-Neutral-BG-[night] bg-Neutral/Neutral-300-[night]"
                    required={formState.stopOptions.triggerStopOptions}
                    autoComplete="off"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormState((prev) => ({
                          ...prev,
                          stopOptions: {
                            ...prev.stopOptions,
                            maxFloorPrice: (floorPrice * 1.1).toFixed(4),
                          },
                        }));
                      }}
                      className="flex-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-Brand/Brand-1 transition-colors"
                    >
                      +10%
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormState((prev) => ({
                          ...prev,
                          stopOptions: {
                            ...prev.stopOptions,
                            maxFloorPrice: (floorPrice * 1.25).toFixed(4),
                          },
                        }));
                      }}
                      className="flex-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-Brand/Brand-1 transition-colors"
                    >
                      +25%
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* {Object.keys(formState.selectedTraits).length > 0 ? (
							<>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
									<div>
										<label
											htmlFor='minTraitPrice'
											className='block text-sm mb-1'>
											Min Trait Price
										</label>
										<input
											inputMode='numeric'
											type='number'
											id='minTraitPrice'
											name='minTraitPrice'
											step={0.0001}
											min={0.0001}
											onChange={(e) =>
												setFormState((prev) => ({
													...prev,
													stopOptions: {
														...prev.stopOptions,
														minTraitPrice: e.target.value,
													},
												}))
											}
											value={formState.stopOptions.minTraitPrice?.toString()}
											placeholder='0.0001'
											className={`w-full p-3 rounded-lg border border-Neutral-BG-[night] bg-Neutral/Neutral-300-[night] `}
											required
											autoComplete='off'
										/>
									</div>
									<div>
										<label
											htmlFor='maxTraitPrice'
											className='block text-sm mb-1'>
											Max Trait Price
										</label>
										<input
											inputMode='numeric'
											type='number'
											id='maxTraitPrice'
											name='maxTraitPrice'
											step={0.0001}
											min={0.0001}
											onChange={(e) =>
												setFormState((prev) => ({
													...prev,
													stopOptions: {
														...prev.stopOptions,
														maxTraitPrice: e.target.value,
													},
												}))
											}
											value={formState.stopOptions.maxTraitPrice?.toString()}
											placeholder='0.0001'
											className={`w-full p-3 rounded-lg border border-Neutral-BG-[night] bg-Neutral/Neutral-300-[night] `}
											required
											autoComplete='off'
										/>
									</div>
								</div>
							</>
						) : (
							<></>
						)} */}

            <div>
              <label htmlFor="maxPurchase" className="block text-sm mb-1">
                Maximum Purchase
              </label>
              <input
                inputMode="numeric"
                type="number"
                id="maxPurchase"
                name="maxPurchase"
                step={1}
                min={1}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    stopOptions: {
                      ...prev.stopOptions,
                      maxPurchase: e.target.value,
                    },
                  }))
                }
                value={formState.stopOptions.maxPurchase?.toString()}
                placeholder="1"
                className={`w-full p-3 rounded-lg border border-Neutral-BG-[night] bg-Neutral/Neutral-300-[night] `}
                autoComplete="off"
              />
              <span>Held: {balance}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6"></div>
      )}
    </>
  );
};

export default StopOption;

interface IStopOption {
  formState: TaskFormState;
  setFormState: React.Dispatch<React.SetStateAction<TaskFormState>>;
}
