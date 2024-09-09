import { Task, useTaskStore } from "@/store";
import { useWalletStore } from "@/store/wallet.store";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import debounce from "lodash/debounce";
import isEqual from "lodash/isEqual";
import { toast } from "react-toastify";

export interface TaskFormState {
  contract: {
    slug: string;
    contractAddress: string;
  };
  selectedWallet: string;
  selectedMarketplaces: string[];
  running: boolean;
  slugValid: boolean | null;
  slugDirty: boolean;
  tags: { name: string; color: string }[];
  selectedTraits: Record<string, string[]>;
  traits: {
    categories: Record<string, string>;
    counts: Record<string, Record<string, number>>;
  };
  outbidOptions: {
    outbid: boolean;
    blurOutbidMargin: string | null;
    openseaOutbidMargin: string | null;
    magicedenOutbidMargin: string | null;
    counterbid: boolean;
  };
  minFloorPrice: string;
  minTraitPrice: string;
  maxPurchase: string;
  pauseAllBids: boolean;
  stopAllBids: boolean;
  cancelAllBids: boolean;
  bidPrice: {
    min: string;
    max: string;
    minType: "percentage" | "eth";
    maxType: "percentage" | "eth";
  };
}

export const useTaskForm = (
  initialState: Omit<TaskFormState, "slugValid" | "slugDirty">,
  taskId?: string
) => {
  const { addTask, editTask } = useTaskStore();
  const { wallets } = useWalletStore();

  const [formState, setFormState] = useState<TaskFormState>({
    ...initialState,
    slugValid: taskId ? true : null,
    slugDirty: false,
    tags: initialState.tags || [],
    selectedTraits: initialState.selectedTraits || {},
    traits: {
      categories: {},
      counts: {},
    },
    outbidOptions: {
      outbid: initialState.outbidOptions.outbid,
      blurOutbidMargin: initialState.outbidOptions.blurOutbidMargin || "",
      openseaOutbidMargin: initialState.outbidOptions.openseaOutbidMargin || "",
      magicedenOutbidMargin:
        initialState.outbidOptions.magicedenOutbidMargin || "",
      counterbid: initialState.outbidOptions.counterbid,
    },
    minFloorPrice: initialState.minFloorPrice || "",
    minTraitPrice: initialState.minTraitPrice || "",
    maxPurchase: initialState.maxPurchase || "",
    pauseAllBids: initialState.pauseAllBids,
    stopAllBids: initialState.stopAllBids,
    cancelAllBids: initialState.cancelAllBids,
    bidPrice: {
      min: initialState.bidPrice.min,
      max: initialState.bidPrice.max,
      minType: initialState.bidPrice?.minType || "percentage",
      maxType: initialState.bidPrice?.maxType || "percentage",
    },
  });

  const [errors, setErrors] = useState<Partial<TaskFormState>>({});

  const prevInitialStateRef = useRef(initialState);

  useEffect(() => {
    if (!isEqual(initialState, prevInitialStateRef.current)) {
      setFormState((prevState) => ({
        ...initialState,
        slugValid: taskId ? true : prevState.slugValid,
        slugDirty: prevState.slugDirty,
        tags: initialState.tags || [],
        selectedTraits: initialState.selectedTraits || {},
        traits: initialState.traits || { categories: {}, counts: {} },
        outbidOptions: {
          outbid: initialState.outbidOptions.outbid,
          blurOutbidMargin: initialState.outbidOptions.blurOutbidMargin || "",
          openseaOutbidMargin:
            initialState.outbidOptions.openseaOutbidMargin || "",
          magicedenOutbidMargin:
            initialState.outbidOptions.magicedenOutbidMargin || "",
          counterbid: initialState.outbidOptions.counterbid,
        },
        bidPrice: {
          min: initialState.bidPrice.min,
          max: initialState.bidPrice.max,
          minType: initialState.bidPrice.minType,
          maxType: initialState.bidPrice.maxType,
        },
      }));
      prevInitialStateRef.current = initialState;
    }
  }, [initialState, taskId]);

  const validateSlug = useCallback(async (slug: string) => {
    if (slug.length < 3) {
      setFormState((prev) => ({ ...prev, slugValid: false }));
      return;
    }

    try {
      const response = await fetch(`/api/ethereum/collections?slug=${slug}`);
      if (response.status === 200) {
        const data = await response.json();
        const contractAddress = data.contracts[0]?.address || "";
        setFormState((prev) => ({
          ...prev,
          slugValid: !!contractAddress,
          contract: {
            ...prev.contract,
            contractAddress,
          },
        }));

        // Update the traits in the form state
        if (data.traits) {
          setFormState((prev) => ({
            ...prev,
            traits: data.traits,
          }));
        }
      } else {
        setFormState((prev) => ({ ...prev, slugValid: false }));
      }
    } catch (error) {
      console.error("Error validating slug:", error);
      setFormState((prev) => ({ ...prev, slugValid: false }));
    }
  }, []);

  const debouncedValidateSlug = useMemo(
    () => debounce(validateSlug, 1500),
    [validateSlug]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));

    if (name === "contract.slug") {
      setFormState((prev) => ({ ...prev, slugDirty: true }));
      if (value.length >= 3) {
        debouncedValidateSlug(value);
      } else {
        setFormState((prev) => ({ ...prev, slugValid: false }));
      }
    }
  };

  const handleMarketplaceToggle = (marketplace: string) => {
    setFormState((prev) => ({
      ...prev,
      selectedMarketplaces: prev.selectedMarketplaces.includes(marketplace)
        ? prev.selectedMarketplaces.filter((m) => m !== marketplace)
        : [...prev.selectedMarketplaces, marketplace],
    }));
  };

  const validateForm = () => {
    const newErrors: Partial<TaskFormState> = {};

    if (!formState.selectedWallet)
      newErrors.selectedWallet = "Wallet selection is required";
    if (formState.selectedMarketplaces.length === 0)
      newErrors.selectedMarketplaces = [
        "At least one marketplace must be selected",
      ];
    if (!formState.minFloorPrice)
      newErrors.minFloorPrice = "Minimum floor price is required";
    if (!formState.minTraitPrice)
      newErrors.minTraitPrice = "Minimum trait price is required";
    if (!formState.maxPurchase)
      newErrors.maxPurchase = "Maximum purchase is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      const selectedWallet = wallets.find(
        (wallet) => wallet.address === formState.selectedWallet
      );
      if (!selectedWallet) {
        toast.error("Selected wallet not found");
        return false;
      }

      const taskData: Omit<Task, "_id"> = {
        contract: {
          slug: formState.contract.slug.toLowerCase(),
          contractAddress: formState.contract.contractAddress,
        },
        selectedWallet: formState.selectedWallet,
        walletPrivateKey: selectedWallet.privateKey,
        bidPrice: {
          min: Number(formState.bidPrice.min),
          max: Number(formState.bidPrice.max),
          minType: formState.bidPrice.minType,
          maxType: formState.bidPrice.maxType,
        },
        selectedMarketplaces: formState.selectedMarketplaces,
        running: formState.running,
        tags: formState.tags,
        selectedTraits: formState.selectedTraits,
        traits: formState.traits,
        outbidOptions: {
          outbid: formState.outbidOptions.outbid,
          blurOutbidMargin: formState.outbidOptions.outbid
            ? Number(formState.outbidOptions.blurOutbidMargin)
            : null,
          openseaOutbidMargin: formState.outbidOptions.outbid
            ? Number(formState.outbidOptions.openseaOutbidMargin)
            : null,
          magicedenOutbidMargin: formState.outbidOptions.outbid
            ? Number(formState.outbidOptions.magicedenOutbidMargin)
            : null,
          counterbid: formState.outbidOptions.counterbid,
        },
        minFloorPrice: Number(formState.minFloorPrice),
        minTraitPrice: Number(formState.minTraitPrice),
        maxPurchase: Number(formState.maxPurchase),
        pauseAllBids: formState.pauseAllBids,
        stopAllBids: formState.stopAllBids,
        cancelAllBids: formState.cancelAllBids,
      };

      try {
        if (taskId) {
          const response = await fetch(`/api/task/${taskId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(taskData),
            credentials: "include",
          });

          if (!response.ok) throw new Error("Failed to update task");
          const updatedTask = await response.json();
          editTask(taskId, updatedTask);
        } else {
          const response = await fetch("/api/task", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(taskData),
            credentials: "include",
          });
          if (!response.ok) throw new Error("Failed to create task");
          const newTask = await response.json();
          addTask(newTask);
        }
        return true;
      } catch (error) {
        console.error("Error submitting task:", error);
        return false;
      }
    }
    return false;
  };

  const handleTagChange = (selectedTags: { name: string; color: string }[]) => {
    setFormState((prev) => ({ ...prev, tags: selectedTags }));
  };

  const handleTraitChange = (traits: Record<string, string[]>) => {
    setFormState((prev) => ({ ...prev, selectedTraits: traits }));
  };

  return {
    formState,
    errors,
    handleChange,
    handleMarketplaceToggle,
    handleSubmit,
    validateSlug,
    setFormState,
    handleTagChange,
    handleTraitChange,
  };
};
