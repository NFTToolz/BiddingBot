import React from "react";
import Toggle from "../common/Toggle";
import { TaskFormState } from "@/hooks/useTaskForm";

const OutbidSection = ({ formState, setFormState }: IOutbidSection) => {
  const updateOutbidOptions = (
    updatedOptions: Partial<typeof formState.outbidOptions>
  ) => {
    setFormState((prev) => {
      const newOutbidOptions = {
        ...prev.outbidOptions,
        ...updatedOptions,
      };

      if (!newOutbidOptions.outbid) {
        newOutbidOptions.counterbid = false; // Disable counterbidding if outbidding is not true
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

  return (
    <>
      <div className="mt-6">
        <h2 className="font-medium mb-4">Outbid Option</h2>
        <div className="flex items-center gap-2">
          <Toggle
            checked={formState.outbidOptions.counterbid}
            onChange={() =>
              updateOutbidOptions({
                counterbid: !formState.outbidOptions.counterbid,
              })
            }
          />
          <span
            className="text-sm cursor-pointer"
            onClick={() =>
              updateOutbidOptions({
                counterbid: !formState.outbidOptions.counterbid,
              })
            }
          >
            {formState.outbidOptions.counterbid
              ? "Disable Instant Counter Bidding"
              : "Enable Instant Counter Bidding"}
          </span>
        </div>
      </div>

      <div className="mt-6">
        {formState.outbidOptions.outbid ||
        formState.outbidOptions.counterbid ? (
          <div className="flex flex-col gap-4">
            {formState.selectedMarketplaces.includes("OpenSea") ? (
              <div>
                <label
                  htmlFor="openseaOutbidMargin"
                  className="block text-sm mb-1"
                >
                  Opensea Outbid/Counterbid Margin
                </label>
                <input
                  inputMode="numeric"
                  type="number"
                  step={0.0001}
                  min={0.0001}
                  max={0.1}
                  id="openseaOutbidMargin"
                  name="openseaOutbidMargin"
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      outbidOptions: {
                        ...prev.outbidOptions,
                        openseaOutbidMargin: e.target.value,
                      },
                    }))
                  }
                  value={formState.outbidOptions.openseaOutbidMargin?.toString()}
                  placeholder="0.0001"
                  className={`w-full p-3 rounded-lg border border-Neutral-BG-[night] bg-Neutral/Neutral-300-[night] `}
                  required
                  autoComplete="off"
                />
              </div>
            ) : null}

            {formState.selectedMarketplaces.includes("Blur") ? (
              <div>
                <label
                  htmlFor="blurOutbidMargin"
                  className="block text-sm mb-1"
                >
                  Blur Outbid/Counterbid Margin
                </label>
                <input
                  inputMode="numeric"
                  type="number"
                  id="blurOutbidMargin"
                  name="blurOutbidMargin"
                  min={0.01}
                  max={0.1}
                  step={0.01}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormState((prev) => ({
                      ...prev,
                      outbidOptions: {
                        ...prev.outbidOptions,
                        blurOutbidMargin: value,
                      },
                    }));
                  }}
                  onBlur={(e) => {
                    const value = Math.max(
                      0.01,
                      parseFloat(e.target.value) || 0
                    );
                    setFormState((prev) => ({
                      ...prev,
                      outbidOptions: {
                        ...prev.outbidOptions,
                        blurOutbidMargin: value.toString(),
                      },
                    }));
                  }}
                  value={formState.outbidOptions.blurOutbidMargin || ""}
                  placeholder="0.01"
                  className={`w-full p-3 rounded-lg border border-Neutral-BG-[night] bg-Neutral/Neutral-300-[night] `}
                  required
                  autoComplete="off"
                />
              </div>
            ) : null}

            {formState.selectedMarketplaces.includes("MagicEden") ? (
              <div>
                <label
                  htmlFor="magicedenOutbidMargin"
                  className="block text-sm mb-1"
                >
                  Magiceden Outbid/Counterbid Margin
                </label>
                <input
                  inputMode="numeric"
                  type="number"
                  id="magicedenOutbidMargin"
                  name="magicedenOutbidMargin"
                  step={0.0001}
                  min={0.0001}
                  max={0.1}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      outbidOptions: {
                        ...prev.outbidOptions,
                        magicedenOutbidMargin: e.target.value,
                      },
                    }))
                  }
                  value={formState.outbidOptions.magicedenOutbidMargin?.toString()}
                  placeholder="0.0001"
                  className={`w-full p-3 rounded-lg border border-Neutral-BG-[night] bg-Neutral/Neutral-300-[night] `}
                  required
                  autoComplete="off"
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
};

export default OutbidSection;

interface IOutbidSection {
  formState: TaskFormState;
  setFormState: React.Dispatch<React.SetStateAction<TaskFormState>>;
}
