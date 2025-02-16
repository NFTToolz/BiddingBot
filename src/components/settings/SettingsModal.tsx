import React, { useState, useCallback, useEffect } from "react";
import Modal from "../common/Modal";
import { toast } from "react-toastify";
import VisibleIcon from "@/assets/svg/VisibleIcon";
import InvisibleIcon from "@/assets/svg/InvisibleIcon";
import { useWebSocket } from "@/app/context/WebSocketContext";
import { useSettingsStore } from "@/store/settings.store";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, setSettings } = useSettingsStore();
  const [apiKey, setApiKey] = useState(settings.apiKey || "");
  const [rateLimit, setRateLimit] = useState(
    settings.rateLimit?.toString() || ""
  );
  const [showApiKey, setShowApiKey] = useState(false);

  const { sendMessage } = useWebSocket();
  const NEXT_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const NEXT_PUBLIC_RATE_LIMIT = process.env.NEXT_PUBLIC_RATE_LIMIT;

  useEffect(() => {
    // Only set initial values if settings are empty/undefined
    if (!settings.apiKey && !settings.rateLimit) {
      setSettings({
        apiKey: process.env.NEXT_PUBLIC_API_KEY as string,
        rateLimit: Number(process.env.NEXT_PUBLIC_RATE_LIMIT as string),
      });
    }

    // Update local state from settings
    setApiKey(settings.apiKey || process.env.NEXT_PUBLIC_API_KEY || "");
    setRateLimit(
      settings.rateLimit?.toString() || process.env.NEXT_PUBLIC_RATE_LIMIT || ""
    );
  }, []); // Remove settings from dependencies

  const handleSubmit = useCallback(async () => {
    try {
      if (!apiKey) {
        toast.error("API Key is required");
        return;
      }

      if (!rateLimit || isNaN(Number(rateLimit)) || Number(rateLimit) <= 0) {
        toast.error("Rate limit must be a positive number");
        return;
      }

      sendMessage({
        endpoint: "update-config",
        data: {
          apiKey,
          rateLimit: Number(rateLimit),
        },
      });

      // Send settings to server
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey,
          rateLimit: Number(rateLimit),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      setSettings({
        apiKey,
        rateLimit: Number(rateLimit),
      });

      toast.success("Settings updated successfully!");
      onClose();
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error(
        `Error: ${
          error instanceof Error ? error.message : "Unknown error occurred"
        }`
      );
    }
  }, [apiKey, rateLimit, onClose]);

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div onClick={handleContentClick}>
        <h2 className="text-center text-xl font-bold my-4 text-[#7364DB]">
          SERVER SETTINGS
        </h2>

        <div className="my-4 w-full">
          <label
            htmlFor="apiKey"
            className="block text-sm text-[#F1F1F1] font-sans"
          >
            API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="mt-2 block w-full border rounded-lg shadow-sm p-4 pr-10 border-[#1F2128] bg-[#2C2C35]"
              required
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showApiKey ? <VisibleIcon /> : <InvisibleIcon />}
            </button>
          </div>
        </div>

        <div className="my-4 w-full">
          <label
            htmlFor="rateLimit"
            className="block text-sm text-[#F1F1F1] font-sans"
          >
            Rate Limit
          </label>
          <input
            type="number"
            value={rateLimit}
            onChange={(e) => setRateLimit(e.target.value)}
            placeholder="Enter rate limit"
            className="mt-2 block w-full border rounded-lg shadow-sm p-4 border-[#1F2128] bg-[#2C2C35]"
            required
            min="1"
            step="1"
          />
        </div>

        <div
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 my-4"
          role="alert"
        >
          <p className="font-bold">Important</p>
          <p>
            These settings are crucial for the server's operation. Make sure to
            enter valid values and keep your API key secure.
          </p>
        </div>

        <div className="flex justify-end mt-8">
          <button
            className="px-12 rounded py-3 bg-[#7364DB] text-white text-sm font-bold"
            onClick={handleSubmit}
          >
            SAVE SETTINGS
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
