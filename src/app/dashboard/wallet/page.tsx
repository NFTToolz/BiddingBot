"use client";

import WalletModal from "@/components/wallet/WalletModal";
import { useWalletStore, Wallet as IWallet } from "@/store";
import React, { useEffect, useState } from "react";
import DeleteIcon from "@/assets/svg/DeleteIcon";
import { toast } from "react-toastify";
import DeleteWalletModal from "@/components/wallet/DeleteWalletModal";
import CopyIcon from "@/assets/svg/CopyIcon";
import Link from "next/link";

const Wallet = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { wallets } = useWalletStore();

  const [balances, setBalances] = useState<{
    [address: string]: {
      eth: string;
      weth: string;
      beth: string;
    };
  }>({});

  const [deleteWallet, setDeleteWallet] = useState<IWallet | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBalances = async () => {
      setIsLoading(true);
      await Promise.all(wallets.map((wallet) => fetchBalances(wallet.address)));
      setIsLoading(false);
    };

    loadBalances();
  }, [wallets]);

  const fetchBalances = async (address: string) => {
    try {
      const response = await fetch(`/api/wallet/balance/${address}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch balances");
      const balanceData = await response.json();

      const truncatedBalances = {
        eth: Number(balanceData.eth).toFixed(4),
        weth: Number(balanceData.weth).toFixed(4),
        beth: Number(balanceData.beth).toFixed(4),
      };

      setBalances((prev) => ({
        ...prev,
        [address]: truncatedBalances,
      }));
    } catch (error) {
      console.error("Error fetching balances:", error);
      toast.error("Failed to fetch wallet balances");
    }
  };

  const handleDelete = (wallet: IWallet) => {
    setDeleteWallet(wallet);
  };

  const confirmDelete = async () => {
    if (!deleteWallet) return;

    try {
      const response = await fetch(`/api/wallet/${deleteWallet.address}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to delete wallet");

      useWalletStore.getState().deleteWallet(deleteWallet._id);
      toast.success("Wallet deleted successfully");
    } catch (error) {
      console.error("Error deleting wallet:", error);
      toast.error("Failed to delete wallet");
    }
    setDeleteWallet(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success("COPIED ADDRESS TO CLIPBOARD");
      })
      .catch((error) => {
        console.error("Failed to copy: ", error);
        toast.error("Failed to copy content.");
      });
  };

  return (
    <section className="ml-20 p-6 pb-24">
      <div className="flex flex-col items-center justify-between mb-8 pb-4 sm:flex-row">
        <h1 className="text-xl font-bold mb-4 sm:mb-0 sm:text-2xl md:text-[28px]">
          Manage Wallet
        </h1>
        <button
          className="w-full sm:w-auto dashboard-btn uppercase bg-Brand/Brand-1 text-xs py-3 px-4 sm:text-sm sm:px-6 md:px-8"
          onClick={() => setIsModalOpen(true)}
        >
          Create New Wallet
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="my-4">
          <Link
            href="/dashboard"
            className="text-Brand/Brand-1 underline font-semibold"
          >
            Back to Tasks
          </Link>
        </div>
        <table className="min-w-full bg-n-8 rounded-lg">
          <thead>
            <tr className="border-b border-n-6">
              <th className="p-4 text-center text-sm font-medium text-n-4">
                Name
              </th>
              <th className="p-4 text-center text-sm font-medium text-n-4">
                Address
              </th>
              <th className="p-4 text-center text-sm font-medium text-n-4">
                ETH Balance
              </th>
              <th className="p-4 text-center text-sm font-medium text-n-4">
                WETH Balance
              </th>
              <th className="p-4 text-center text-sm font-medium text-n-4">
                BETH Balance
              </th>
              <th className="p-4 text-center text-sm font-medium text-n-4">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center p-4 text-n-4">
                  Loading wallet balances...
                </td>
              </tr>
            ) : (
              wallets.map((wallet) => (
                <tr
                  key={wallet.address}
                  className="border-b border-n-6 hover:bg-n-7"
                >
                  <td className="p-4 text-sm text-n-1 text-center">
                    {wallet.name}
                  </td>
                  <td className="p-4 text-sm text-n-1 flex justify-center items-center gap-1">
                    {`${wallet.address.slice(0, 6)}...${wallet.address.slice(
                      -4
                    )}`}
                    <button
                      onClick={() => copyToClipboard(wallet.address)}
                      className="text-sm text-Brand/Brand-1 hover:text-Brand/Brand-2"
                    >
                      <CopyIcon />
                    </button>
                  </td>
                  <td className="p-4 text-sm text-n-1 text-center">
                    {balances[wallet.address]?.eth || "0"}
                  </td>
                  <td className="p-4 text-sm text-n-1 text-center">
                    {balances[wallet.address]?.weth || "0"}
                  </td>
                  <td className="p-4 text-sm text-n-1 text-center">
                    {balances[wallet.address]?.beth || "0"}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDelete(wallet)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <DeleteIcon />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {deleteWallet && (
        <DeleteWalletModal
          isOpen={deleteWallet !== null}
          onClose={() => setDeleteWallet(null)}
          onConfirm={confirmDelete}
          walletAddress={deleteWallet.address}
          walletName={deleteWallet.name}
        />
      )}

      <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
};

export default Wallet;
