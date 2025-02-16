import React, { useEffect, useState, useCallback } from "react";
import Modal from "../common/Modal";
import VisibleIcon from "@/assets/svg/VisibleIcon";
import InvisibleIcon from "@/assets/svg/InvisibleIcon";
import { ethers } from "ethers";
import { Wallet } from "ethers";
import { HDNodeWallet } from "ethers";
import {
  generateWalletName,
  importWalletFromMnemonic,
  importWalletFromPrivateKey,
  isValidPrivateKeyOrSeedPhrase,
} from "@/utils";
import { toast } from "react-toastify";
import { useWalletStore } from "@/store";
import CopyIcon from "@/assets/svg/CopyIcon";

const WalletModal = ({ isOpen, onClose }: WalletModalProps) => {
  const [walletName, setWalletName] = useState("");
  const [importValue, setImportValue] = useState("");
  const [showImportInput, setShowImportInput] = useState(false);
  const [visible, setVisible] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [step, setStep] = useState(1);
  const [wallet, setWallet] = useState<ethers.Wallet | HDNodeWallet | null>(
    null
  );
  const addWallet = useWalletStore((state) => state.addWallet);

  useEffect(() => {
    const setupProvider = async () => {
      if (window.ethereum) {
        const ethersProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(ethersProvider);
      }
    };
    setupProvider();
  }, []);

  const createNewWallet = useCallback(() => {
    try {
      const newWallet = ethers.Wallet.createRandom();
      return newWallet;
    } catch (error) {
      console.error("Error creating new wallet:", error);
      throw error;
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      let newWallet: Wallet | HDNodeWallet | null = null;

      if (showImportInput) {
        const source = isValidPrivateKeyOrSeedPhrase(importValue);
        if (!source) {
          throw new Error("Invalid private key or seed phrase");
        }

        newWallet =
          source === "MNEMONIC"
            ? importWalletFromMnemonic(importValue)
            : importWalletFromPrivateKey(importValue);
      } else {
        newWallet = createNewWallet();
      }

      if (newWallet) {
        setWallet(newWallet);
        // Add wallet to the database
        const response = await fetch("/api/wallet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: walletName || generateWalletName(),
            address: newWallet.address,
            privateKey: newWallet.privateKey, // Ensure this is available
          }),
        });

        if (!response.ok) throw new Error("Failed to add wallet to database");

        const data = await response.json();

        addWallet({
          _id: data._id,
          name: walletName || generateWalletName(),
          address: newWallet.address,
          privateKey: newWallet.privateKey,
          openseaApproval: false,
          magicedenApproval: false,
          blurApproval: false,
        });

        setStep(2);
        toast.success("Wallet created successfully!");

        // Reset state
        setWalletName("");
        setImportValue("");
        setShowImportInput(false);
        setVisible(false);
      } else {
        throw new Error("Failed to create or import wallet");
      }
    } catch (error) {
      console.error("Error creating wallet:", error);
      toast.error(
        `Error: ${
          error instanceof Error ? error.message : "Unknown error occurred"
        }`
      );
    }
  }, [showImportInput, importValue, createNewWallet, walletName, addWallet]);

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success(message);
      })
      .catch((error) => {
        console.error("Failed to copy: ", error);
        toast.error("Failed to copy content.");
      });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div onClick={handleContentClick}>
        {step === 1 ? (
          <>
            <h2 className="text-center text-xl font-bold my-4 text-[#7364DB]">
              {showImportInput
                ? "IMPORT EXISTING WALLET"
                : "CREATE A NEW WALLET"}
            </h2>
            <>
              <div className="my-4 w-full">
                <label
                  htmlFor="walletName"
                  className="block text-sm text-[#F1F1F1] font-sans"
                >
                  Wallet Name
                </label>
                <input
                  maxLength={64}
                  type="text"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  placeholder={`Wallet 1`}
                  className="mt-2 block w-full border rounded-lg shadow-sm p-4 border-[#1F2128] bg-[#2C2C35]"
                  required
                  autoComplete="off"
                />
              </div>

              {showImportInput && (
                <div className="mt-8 mb-4 w-full">
                  <label
                    htmlFor="walletName"
                    className="block text-sm text-[#F1F1F1] font-sans"
                  >
                    Private Key / Seed Phrase
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={importValue}
                      onChange={(e) => setImportValue(e.target.value)}
                      placeholder="Enter private key or seed phrase"
                      className={`mt-2 block w-full border rounded-lg shadow-sm p-4 pr-10 border-[#1F2128] bg-[#2C2C35] ${
                        !visible ? "text-security" : ""
                      }`}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setVisible(!visible)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {visible ? <VisibleIcon /> : <InvisibleIcon />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <p
                  className="text-sm font-sans cursor-pointer text-[#7364DB]"
                  onClick={() => setShowImportInput(!showImportInput)}
                >
                  {showImportInput
                    ? "hide"
                    : "Import from private key or phrase"}
                </p>
              </div>
            </>

            <div className="flex justify-end mt-8">
              <button
                className="px-12 rounded py-3 bg-[#7364DB] text-white text-sm font-bold"
                onClick={handleSubmit}
              >
                {showImportInput ? "IMPORT" : "CREATE"}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-center text-xl font-bold my-4 text-[#7364DB]">
              Wallet Details
            </h2>
            <div className="flex flex-col space-y-4">
              <p>Address:</p>

              <div className="flex gap-1">
                <p className="break-all">
                  {wallet?.address
                    ? `${wallet.address.slice(0, 6)} ... ${wallet.address.slice(
                        -4
                      )}`
                    : ""}
                </p>
                <button
                  onClick={() => {
                    if (wallet?.address) {
                      copyToClipboard(
                        wallet.address,
                        "COPIED ADDRESS TO CLIPBOARD"
                      );
                    }
                  }}
                  className="text-sm text-[#7364DB] mt-1"
                >
                  <CopyIcon />
                </button>
              </div>
              <div>
                <p>Private Key:</p>
                <div className="flex gap-1 items-center">
                  <p className="break-all">
                    ••••••••••••••••••••••••••••••••••••••••••••
                  </p>
                  <button
                    onClick={() => {
                      if (wallet?.privateKey) {
                        copyToClipboard(
                          wallet.privateKey,
                          "COPIED PRIVATE KEY TO CLIPBOARD"
                        );
                      }
                    }}
                    className="text-sm text-[#7364DB] mt-1"
                  >
                    <CopyIcon />
                  </button>
                </div>
              </div>
              <div
                className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4"
                role="alert"
              >
                <p className="font-bold">Warning</p>
                <p>
                  Please copy and securely store your private key or seed
                  phrase. This is the only way to recover your wallet if you
                  lose access.
                </p>
              </div>
              <div className="flex justify-between">
                <button
                  className="px-12 rounded py-3 bg-[#7364DB] text-white text-sm font-bold"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default WalletModal;

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider;
  }
}
